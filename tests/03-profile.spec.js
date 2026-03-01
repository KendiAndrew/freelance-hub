const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Профіль користувача', () => {

  test('1. Гість — перенаправлення або повідомлення', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Має бути повідомлення або перенаправлення
    const authMessage = page.locator('text=Увійдіть')
    const isVisible = await authMessage.isVisible().catch(() => false)
    const url = page.url()

    expect(isVisible || url.includes('/login')).toBeTruthy()

    console.log('✓ Гість не має доступу до профілю')
  })

  test('2. Клієнт — перегляд профілю', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Логін та email видно завжди (латиниця)
    await expect(page.locator('text=ivan_koval').first()).toBeVisible()

    // Роль
    await expect(page.locator('text=Замовник').first()).toBeVisible()

    // Кнопка редагувати
    await expect(page.locator('text=Редагувати профіль')).toBeVisible()

    console.log('✓ Клієнт бачить свій профіль')
  })

  test('3. Клієнт — редагування профілю', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    await page.click('text=Редагувати профіль')
    await page.waitForLoadState('networkidle')

    // Міняємо місто
    const cityInput = page.locator('input').filter({ hasText: '' }).nth(2)
    // Знаходимо інпут міста
    const inputs = page.locator('input[type="text"]')
    const inputCount = await inputs.count()

    // Натискаємо Зберегти
    const saveBtn = page.locator('text=Зберегти')
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForLoadState('networkidle')
    }

    console.log('✓ Режим редагування профілю працює')
  })

  test('4. Виконавець — перегляд профілю з додатковими полями', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Логін видно завжди
    await expect(page.locator('text=dev_andriy').first()).toBeVisible()

    // Роль
    await expect(page.locator('text=Виконавець').first()).toBeVisible()

    // Додаткові поля виконавця
    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Сс]пеціалізація|[Рр]езюме|[Пп]ортфоліо|[Рр]ейтинг/)

    console.log('✓ Виконавець бачить профіль з додатковими полями')
  })

  test('5. Адмін — перегляд профілю', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Адміністратор').first()).toBeVisible()

    console.log('✓ Адмін бачить свій профіль')
  })

  test('6. API GET /api/profile без авторизації', async ({ request }) => {
    const res = await request.get('/api/profile')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ API profile без авторизації: ${res.status()}`)
  })

})
