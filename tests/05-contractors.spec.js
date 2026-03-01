const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Фрілансери', () => {

  test('1. Список фрілансерів — гість бачить', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('.card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    console.log(`✓ Гість: бачить ${count} фрілансерів`)
  })

  test('2. Фільтрація за спеціалізацією', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    const allCount = await page.locator('.card').count()

    // Фільтр Design
    const designBtn = page.locator('button:has-text("Дизайн")')
    if (await designBtn.isVisible()) {
      await designBtn.click()
      await page.waitForLoadState('networkidle')
      const filteredCount = await page.locator('.card').count()
      expect(filteredCount).toBeLessThanOrEqual(allCount)

      await page.locator('button:has-text("Всі")').click()
      await page.waitForLoadState('networkidle')
    }

    console.log('✓ Фільтрація фрілансерів працює')
  })

  test('3. Картка фрілансера — рейтинг зірки', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    const stars = page.locator('.text-amber-400')
    const count = await stars.count()
    expect(count).toBeGreaterThan(0)

    const text = await stars.first().textContent()
    expect(text).toMatch(/[★☆]+/)

    console.log('✓ Зірки рейтингу відображаються')
  })

  test('4. Перехід на профіль фрілансера', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    await page.locator('.card').first().click()
    await page.waitForURL(/\/contractors\/\d+/)

    await expect(page.locator('h1')).toBeVisible()

    console.log('✓ Перехід на профіль фрілансера працює')
  })

  test('5. Профіль фрілансера — повна інформація', async ({ page }) => {
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    // Ім'я
    await expect(page.locator('h1')).toContainText('Андрій')

    // Рейтинг
    const stars = page.locator('.text-amber-400').first()
    await expect(stars).toBeVisible()

    // Секція відгуків
    await expect(page.locator('text=Відгуки').first()).toBeVisible()

    // Кнопка назад
    await expect(page.locator('text=Назад до фрілансерів')).toBeVisible()

    console.log('✓ Профіль фрілансера: повна інформація')
  })

  test('6. Клієнт бачить кнопку "Запропонувати угоду"', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Запропонувати угоду')).toBeVisible()

    console.log('✓ Клієнт бачить кнопку угоди')
  })

  test('7. Виконавець НЕ бачить кнопку угоди', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Запропонувати угоду')).toHaveCount(0)

    console.log('✓ Виконавець не бачить кнопку угоди')
  })

  test('8. API GET /api/contractors', async ({ request }) => {
    const res = await request.get('/api/contractors')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toBeGreaterThan(0)

    const first = data[0]
    expect(first).toHaveProperty('contractor_id')
    expect(first).toHaveProperty('first_name')
    expect(first).toHaveProperty('rating')
    expect(first).toHaveProperty('specialization')

    console.log(`✓ API: ${data.length} фрілансерів`)
  })

  test('9. API GET /api/contractors/1 з рейтингами', async ({ request }) => {
    const res = await request.get('/api/contractors/1')
    expect(res.status()).toBe(200)

    const data = await res.json()
    expect(data.contractor_id).toBe(1)
    expect(data).toHaveProperty('ratings')
    expect(Array.isArray(data.ratings)).toBeTruthy()

    console.log(`✓ API: ${data.first_name} — ${data.ratings.length} відгуків`)
  })

  test('10. API GET /api/contractors/99999 — неіснуючий', async ({ request }) => {
    const res = await request.get('/api/contractors/99999')
    expect(res.status()).toBe(404)

    console.log('✓ API: 404 для неіснуючого фрілансера')
  })

  test('11. API фільтрація фрілансерів за спеціалізацією', async ({ request }) => {
    const res = await request.get('/api/contractors?specialization=Design')
    expect(res.status()).toBe(200)

    const data = await res.json()
    for (const c of data) {
      expect(c.specialization).toBe('Design')
    }

    console.log(`✓ API: фільтрація — ${data.length} дизайнерів`)
  })

})
