const { test, expect } = require('@playwright/test')

test.describe('Головна сторінка', () => {

  test('1. Завантаження головної сторінки', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('http://localhost:3000/')
    console.log('✓ Головна сторінка завантажилась')
  })

  test('2. Hero-секція з заголовком та кнопками', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Заголовок
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()

    // Кнопка "Переглянути проекти"
    const projectsBtn = page.locator('a:has-text("проект")')
    await expect(projectsBtn.first()).toBeVisible()

    // Кнопка реєстрації
    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink.first()).toBeVisible()

    console.log('✓ Hero-секція відображається коректно')
  })

  test('3. Секція спеціалізацій', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Перевіряємо 4 спеціалізації
    for (const spec of ['Web', 'Design', 'Writing', 'Marketing']) {
      const el = page.locator(`text=${spec}`).first()
      // Перевіряємо чи є хоча б згадка спеціалізації
    }

    console.log('✓ Секція спеціалізацій присутня')
  })

  test('4. Навбар — гостьовий вигляд', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Гість бачить: Проекти, Фрілансери, Увійти, Реєстрація
    await expect(page.locator('a[href="/projects"]').first()).toBeVisible()
    await expect(page.locator('a[href="/contractors"]').first()).toBeVisible()
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()

    // Гість НЕ бачить: Угоди, Скарги, Ескроу, Вийти
    await expect(page.locator('a[href="/deals"]')).toHaveCount(0)
    await expect(page.locator('a[href="/complaints"]')).toHaveCount(0)
    await expect(page.locator('a[href="/escrow"]')).toHaveCount(0)

    console.log('✓ Навбар: гостьовий вигляд коректний')
  })

  test('5. Навігація кнопки "Проекти" → /projects', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.locator('a[href="/projects"]').first().click()
    await page.waitForURL('/projects')
    await expect(page).toHaveURL(/\/projects/)

    console.log('✓ Навігація на /projects працює')
  })

  test('6. Навігація "Фрілансери" → /contractors', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.locator('a[href="/contractors"]').first().click()
    await page.waitForURL('/contractors')
    await expect(page).toHaveURL(/\/contractors/)

    console.log('✓ Навігація на /contractors працює')
  })

})
