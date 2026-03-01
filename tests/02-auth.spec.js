const { test, expect } = require('@playwright/test')
const { login, logout } = require('./helpers')

test.describe('Авторизація та реєстрація', () => {

  test('1. Сторінка логіну — відображення форми', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Вхід')
    await expect(page.locator('input[placeholder="Введіть логін"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Введіть пароль"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()

    console.log('✓ Форма логіну відображається')
  })

  test('2. Логін клієнта ivan_koval', async ({ page }) => {
    await login(page, 'ivan_koval')

    // Перевіряємо навбар — має бути ім'я та кнопка Вийти
    await expect(page.locator('text=Вийти')).toBeVisible()
    // Має бути посилання на угоди, скарги, ескроу
    await expect(page.locator('a[href="/deals"]').first()).toBeVisible()
    await expect(page.locator('a[href="/complaints"]').first()).toBeVisible()
    await expect(page.locator('a[href="/escrow"]').first()).toBeVisible()

    console.log('✓ Клієнт ivan_koval увійшов')
  })

  test('3. Невірний пароль — помилка', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder="Введіть логін"]', 'ivan_koval')
    await page.fill('input[placeholder="Введіть пароль"]', 'wrong_password')
    await page.click('button[type="submit"]')

    // Чекаємо помилку
    await page.waitForSelector('text=Невірний логін або пароль', { timeout: 10000 })
    await expect(page.locator('text=Невірний логін або пароль')).toBeVisible()

    console.log('✓ Невірний пароль — показує помилку')
  })

  test('4. Логін виконавця dev_andriy', async ({ page }) => {
    await login(page, 'dev_andriy')

    await expect(page.locator('text=Вийти')).toBeVisible()
    // Виконавець НЕ бачить кнопку Адмін
    await expect(page.locator('a[href="/admin"]')).toHaveCount(0)

    console.log('✓ Виконавець dev_andriy увійшов')
  })

  test('5. Логін адміна admin', async ({ page }) => {
    await login(page, 'admin')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Вийти')).toBeVisible({ timeout: 10000 })
    // Адмін бачить кнопку Адмін
    await expect(page.locator('a[href="/admin"]').first()).toBeVisible({ timeout: 10000 })

    console.log('✓ Адмін увійшов, бачить кнопку Адмін')
  })

  test('6. Вихід з акаунту', async ({ page }) => {
    await login(page, 'ivan_koval')
    await expect(page.locator('text=Вийти')).toBeVisible()

    await logout(page)
    await page.waitForLoadState('networkidle')

    // Після виходу — гостьовий навбар
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()

    console.log('✓ Вихід з акаунту працює')
  })

  test('7. Сторінка реєстрації — відображення форми', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Реєстрація')

    // Вибір ролі
    await expect(page.locator('text=Замовник')).toBeVisible()
    await expect(page.locator('text=Виконавець')).toBeVisible()

    // Поля
    await expect(page.locator('input[placeholder="Іван"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Петренко"]')).toBeVisible()
    await expect(page.locator('input[placeholder="ivan_petrenko"]')).toBeVisible()
    await expect(page.locator('input[placeholder="ivan@example.com"]')).toBeVisible()

    console.log('✓ Форма реєстрації відображається')
  })

  test('8. Реєстрація — валідація паролів', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    // Заповнюємо обов'язкові поля
    await page.fill('input[placeholder="Іван"]', 'Тест')
    await page.fill('input[placeholder="Петренко"]', 'Тестенко')
    await page.fill('input[placeholder="ivan_petrenko"]', 'test_validation')
    await page.fill('input[placeholder="ivan@example.com"]', 'valid@test.ua')
    await page.fill('input[placeholder="Мінімум 6 символів"]', '123456')
    await page.fill('input[placeholder="Повторіть пароль"]', '654321')

    await page.click('button[type="submit"]')

    // Має бути помилка про паролі
    await page.waitForSelector('text=Паролі не збігаються', { timeout: 5000 })

    console.log('✓ Валідація паролів працює')
  })

  test('9. Реєстрація — короткий пароль', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder="Іван"]', 'Тест')
    await page.fill('input[placeholder="Петренко"]', 'Тестенко')
    await page.fill('input[placeholder="ivan_petrenko"]', 'test_short')
    await page.fill('input[placeholder="ivan@example.com"]', 'short@test.ua')
    await page.fill('input[placeholder="Мінімум 6 символів"]', '123')
    await page.fill('input[placeholder="Повторіть пароль"]', '123')

    await page.click('button[type="submit"]')

    await page.waitForSelector('text=мінімум 6', { timeout: 5000 })

    console.log('✓ Валідація мінімальної довжини пароля працює')
  })

  test('10. Реєстрація виконавця — поле спеціалізації', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    // Натискаємо "Виконавець"
    await page.locator('text=Виконавець').click()

    // Має з'явитися поле спеціалізації
    const specSelect = page.locator('select')
    await expect(specSelect).toBeVisible()

    console.log('✓ Поле спеціалізації з\'являється для виконавця')
  })

})
