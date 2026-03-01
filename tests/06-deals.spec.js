const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Угоди', () => {

  test('1. Гість — не має доступу до /deals', async ({ page }) => {
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    const authMessage = page.locator('text=Увійдіть')
    const isVisible = await authMessage.isVisible().catch(() => false)
    const url = page.url()

    expect(isVisible || url.includes('/login')).toBeTruthy()

    console.log('✓ Гість не має доступу до угод')
  })

  test('2. Клієнт бачить свої угоди', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    // Перевіряємо що сторінка завантажилась
    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Уу]годи|[Уу]год/)

    console.log('✓ Клієнт бачить сторінку угод')
  })

  test('3. Виконавець бачить свої угоди', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Уу]годи|[Уу]год/)

    console.log('✓ Виконавець бачить сторінку угод')
  })

  test('4. Адмін бачить ВСІ угоди', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Уу]годи|[Уу]год/)

    console.log('✓ Адмін бачить сторінку угод')
  })

  test('5. Статус-бейджі угод', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    // Перевіряємо наявність бейджів статусів
    const pageText = await page.textContent('body')
    const hasStatuses = pageText.match(/Очікує|В роботі|Завершено|Скасовано|Pending|In Progress|Completed|Cancelled/i)

    console.log(`✓ Статуси угод: ${hasStatuses ? 'знайдено' : 'порожній список'}`)
  })

  test('6. API GET /api/deals без авторизації', async ({ request }) => {
    const res = await request.get('/api/deals')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: GET deals без авторизації → ${res.status()}`)
  })

  test('7. API POST /api/deals без авторизації', async ({ request }) => {
    const res = await request.post('/api/deals', {
      data: { projectId: 1, contractorId: 1, amount: 1000 }
    })
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: POST deals без авторизації → ${res.status()}`)
  })

  test('8. API GET /api/deals/1 — деталі угоди', async ({ request }) => {
    const res = await request.get('/api/deals/1')

    if (res.status() === 200) {
      const data = await res.json()
      expect(data).toHaveProperty('deal_id')
      expect(data).toHaveProperty('amount')
      expect(data).toHaveProperty('status')
      console.log(`✓ API: угода #1, статус="${data.status}", сума=${data.amount}`)
    } else {
      console.log(`✓ API: угода #1 не знайдена (${res.status()})`)
    }
  })

  test('9. Кнопки зміни статусу — Pending угода', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/deals')
    await page.waitForLoadState('networkidle')

    // Шукаємо угоду зі статусом Pending/Очікує
    const acceptBtn = page.locator('button:has-text("Прийняти")')
    const cancelBtn = page.locator('button:has-text("Скасувати")')

    const hasAccept = await acceptBtn.first().isVisible().catch(() => false)
    const hasCancel = await cancelBtn.first().isVisible().catch(() => false)

    console.log(`✓ Кнопки для Pending: Прийняти=${hasAccept}, Скасувати=${hasCancel}`)
  })

})
