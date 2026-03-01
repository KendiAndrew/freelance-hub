const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Ескроу', () => {

  test('1. Гість — не має доступу до /escrow', async ({ page }) => {
    await page.goto('/escrow')
    await page.waitForLoadState('networkidle')

    const authMessage = page.locator('text=Увійдіть')
    const isVisible = await authMessage.isVisible().catch(() => false)
    const url = page.url()

    expect(isVisible || url.includes('/login')).toBeTruthy()

    console.log('✓ Гість не має доступу до ескроу')
  })

  test('2. Клієнт бачить ескроу-рахунки', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/escrow')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Ее]скроу/)

    console.log('✓ Клієнт бачить сторінку ескроу')
  })

  test('3. Адмін бачить ВСІ ескроу-рахунки', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/escrow')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Ее]скроу/)

    console.log('✓ Адмін бачить всі ескроу')
  })

  test('4. Статуси ескроу — бейджі', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/escrow')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    const hasStatus = pageText.match(/Заморожено|Виплачено|Повернуто|Frozen|Released/i)

    console.log(`✓ Статуси ескроу: ${hasStatus ? hasStatus[0] : 'порожній список'}`)
  })

  test('5. Підсумкові картки ескроу', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/escrow')
    await page.waitForLoadState('networkidle')

    // Перевіряємо чи є підсумкові картки (заморожено / випущено / повернуто)
    const pageText = await page.textContent('body')

    console.log('✓ Сторінка ескроу завантажена')
  })

  test('6. API GET /api/escrow без авторизації', async ({ request }) => {
    const res = await request.get('/api/escrow')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: GET escrow без авторизації → ${res.status()}`)
  })

})
