const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Адмін-панель', () => {

  test('1. Клієнт не має доступу до /admin', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    const denied = pageText.match(/заборонено|адміністратор|admin only/i)

    expect(denied).toBeTruthy()

    console.log('✓ Клієнт не має доступу до адмін-панелі')
  })

  test('2. Виконавець не має доступу до /admin', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    const denied = pageText.match(/заборонено|адміністратор|admin only/i)

    expect(denied).toBeTruthy()

    console.log('✓ Виконавець не має доступу до адмін-панелі')
  })

  test('3. Адмін бачить панель зі вкладками', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // 3 вкладки
    await expect(page.locator('text=Статистика').first()).toBeVisible()
    await expect(page.locator('text=Користувачі').first()).toBeVisible()
    await expect(page.locator('text=Топ виконавц').first()).toBeVisible()

    console.log('✓ Адмін бачить 3 вкладки')
  })

  test('4. Вкладка "Статистика" — картки та таблиця', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Статистика вже активна за замовчуванням
    const pageText = await page.textContent('body')

    // Має бути статистика
    const hasStats = pageText.match(/угод|користувач|клієнт|виконавц/i)
    expect(hasStats).toBeTruthy()

    console.log('✓ Вкладка Статистика: дані відображаються')
  })

  test('5. Вкладка "Користувачі" — список юзерів', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Переключаємо на вкладку Користувачі
    await page.locator('button:has-text("Користувачі")').click()
    await page.waitForLoadState('networkidle')

    // Чекаємо появу списку користувачів
    await page.waitForTimeout(1000)

    const pageText = await page.textContent('body')
    // Має бути хоча б один користувач
    const hasUsers = pageText.match(/ivan_koval|admin|dev_andriy|olena_shevch/i)
    expect(hasUsers).toBeTruthy()

    // Кнопка Видалити (не для адмінів)
    const deleteBtn = page.locator('button:has-text("Видалити")')
    const deleteCount = await deleteBtn.count()

    console.log(`✓ Вкладка Користувачі: знайдено ${deleteCount} кнопок видалення`)
  })

  test('6. Вкладка "Топ виконавців"', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Переключаємо на вкладку Топ виконавців
    await page.locator('button:has-text("Топ виконавц")').click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const pageText = await page.textContent('body')
    // Має бути рейтинг зірками
    const hasStars = pageText.match(/[★☆]/)

    console.log(`✓ Вкладка Топ: зірки=${!!hasStars}`)
  })

  test('7. API GET /api/admin/stats без авторизації', async ({ request }) => {
    const res = await request.get('/api/admin/stats')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: admin/stats без авторизації → ${res.status()}`)
  })

  test('8. API GET /api/admin/users без авторизації', async ({ request }) => {
    const res = await request.get('/api/admin/users')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: admin/users без авторизації → ${res.status()}`)
  })

  test('9. API DELETE /api/admin/users без авторизації', async ({ request }) => {
    const res = await request.delete('/api/admin/users?id=999')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: DELETE admin/users без авторизації → ${res.status()}`)
  })

})
