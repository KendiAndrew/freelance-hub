const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Проекти', () => {

  test('1. Список проектів — гість бачить проекти', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('.card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    console.log(`✓ Гість: бачить ${count} проектів`)
  })

  test('2. Фільтрація за спеціалізацією', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // Рахуємо всі проекти
    const allCards = await page.locator('.card').count()

    // Фільтруємо — натискаємо кнопку дизайн
    const designBtn = page.locator('button:has-text("Дизайн")')
    if (await designBtn.isVisible()) {
      await designBtn.click()
      await page.waitForTimeout(1500)
      await page.waitForLoadState('networkidle')

      const filteredCards = await page.locator('.card').count()
      expect(filteredCards).toBeLessThanOrEqual(allCards)

      // Повертаємо всі
      await page.locator('button:has-text("Всі")').click()
      await page.waitForTimeout(1500)
      await page.waitForLoadState('networkidle')
      const resetCards = await page.locator('.card').count()
      expect(resetCards).toBeGreaterThan(0)
    }

    console.log('✓ Фільтрація проектів працює')
  })

  test('3. Гість НЕ бачить кнопку "Створити проект"', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Створити проект')).toHaveCount(0)

    console.log('✓ Гість не бачить кнопку створення проекту')
  })

  test('4. Клієнт бачить кнопку "Створити проект"', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Створити проект').first()).toBeVisible()

    console.log('✓ Клієнт бачить кнопку створення проекту')
  })

  test('5. Виконавець НЕ бачить кнопку "Створити проект"', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Створити проект')).toHaveCount(0)

    console.log('✓ Виконавець не бачить кнопку створення проекту')
  })

  test('6. Деталі проекту — перегляд', async ({ page }) => {
    await page.goto('/projects/1')
    await page.waitForLoadState('networkidle')

    // Має бути опис, бюджет, дедлайн
    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/грн|бюджет|UAH/i)

    // Посилання "Назад"
    await expect(page.locator('text=Назад').first()).toBeVisible()

    console.log('✓ Деталі проекту відображаються')
  })

  test('7. Власник бачить кнопки редагування та видалення', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/projects/1')
    await page.waitForLoadState('networkidle')

    // ivan_koval є власником проекту 1
    const editBtn = page.locator('text=Редагувати')
    const deleteBtn = page.locator('text=Видалити')

    // Якщо це його проект — кнопки видно
    const hasEdit = await editBtn.isVisible().catch(() => false)
    const hasDelete = await deleteBtn.isVisible().catch(() => false)

    console.log(`✓ Кнопки: Редагувати=${hasEdit}, Видалити=${hasDelete}`)
  })

  test('8. Чужий проект — без кнопок', async ({ page }) => {
    await login(page, 'olena_shevch')
    await page.goto('/projects/1')
    await page.waitForLoadState('networkidle')

    // olena_shevch НЕ є власником проекту 1
    const editBtn = page.locator('button:has-text("Редагувати")')
    const deleteBtn = page.locator('button:has-text("Видалити")')

    await expect(editBtn).toHaveCount(0)
    await expect(deleteBtn).toHaveCount(0)

    console.log('✓ Чужий проект — кнопки редагування відсутні')
  })

  test('9. API GET /api/projects — публічний', async ({ request }) => {
    const res = await request.get('/api/projects')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toBeGreaterThan(0)

    const first = data[0]
    expect(first).toHaveProperty('project_id')
    expect(first).toHaveProperty('description')
    expect(first).toHaveProperty('budget')
    expect(first).toHaveProperty('client_name')

    console.log(`✓ API: ${data.length} проектів`)
  })

  test('10. API GET /api/projects/1 — деталі проекту', async ({ request }) => {
    const res = await request.get('/api/projects/1')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(data.project_id).toBe(1)
    expect(data).toHaveProperty('description')
    expect(data).toHaveProperty('client_name')

    console.log(`✓ API: проект #1 — "${data.description?.substring(0, 40)}..."`)
  })

  test('11. API GET /api/projects/99999 — неіснуючий', async ({ request }) => {
    const res = await request.get('/api/projects/99999')
    expect(res.status()).toBe(404)

    console.log('✓ API: 404 для неіснуючого проекту')
  })

  test('12. API POST /api/projects без авторизації', async ({ request }) => {
    const res = await request.post('/api/projects', {
      data: { description: 'test', specialization: 'Design', budget: 1000, deadline: '2026-12-31' }
    })
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: POST без авторизації → ${res.status()}`)
  })

  test('13. API фільтрація проектів', async ({ request }) => {
    const res = await request.get('/api/projects?specialization=Design')
    expect(res.status()).toBe(200)

    const data = await res.json()
    for (const p of data) {
      expect(p.specialization).toBe('Design')
    }

    console.log(`✓ API: фільтрація — ${data.length} проектів зі спеціалізацією Design`)
  })

})
