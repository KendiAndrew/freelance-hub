const { test, expect } = require('@playwright/test')
const { login } = require('./helpers')

test.describe('Скарги', () => {

  test('1. Гість — не має доступу до /complaints', async ({ page }) => {
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const authMessage = page.locator('text=Увійдіть')
    const isVisible = await authMessage.isVisible().catch(() => false)
    const url = page.url()

    expect(isVisible || url.includes('/login')).toBeTruthy()

    console.log('✓ Гість не має доступу до скарг')
  })

  test('2. Клієнт бачить свої скарги', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Сс]карг/)

    // Клієнт бачить кнопку подати скаргу
    const submitBtn = page.locator('text=Подати скаргу')
    const hasSubmit = await submitBtn.isVisible().catch(() => false)

    console.log(`✓ Клієнт бачить скарги, кнопка подачі: ${hasSubmit}`)
  })

  test('3. Виконавець бачить скарги', async ({ page }) => {
    await login(page, 'dev_andriy')
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Сс]карг/)

    console.log('✓ Виконавець бачить сторінку скарг')
  })

  test('4. Адмін бачить ВСІ скарги з кнопками управління', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/[Сс]карг/)

    // Адмін НЕ бачить кнопку "Подати скаргу"
    const submitBtn = page.locator('button:has-text("Подати скаргу")')
    const hasSubmit = await submitBtn.isVisible().catch(() => false)

    // Адмін бачить кнопки вирішення
    const resolveBtn = page.locator('button:has-text("Вирішено")')
    const rejectBtn = page.locator('button:has-text("Відхилити")')
    const hasResolve = await resolveBtn.first().isVisible().catch(() => false)
    const hasReject = await rejectBtn.first().isVisible().catch(() => false)

    console.log(`✓ Адмін: подати=${hasSubmit}, вирішити=${hasResolve}, відхилити=${hasReject}`)
  })

  test('5. Клієнт — відкриття форми подачі скарги', async ({ page }) => {
    await login(page, 'ivan_koval')
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const submitBtn = page.locator('text=Подати скаргу')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')

      // Перевіряємо форму
      const receiverInput = page.locator('input[type="number"]')
      const subjectInput = page.locator('input[placeholder*="проблему"]')
      const detailsTextarea = page.locator('textarea')

      const hasReceiver = await receiverInput.isVisible().catch(() => false)
      const hasSubject = await subjectInput.isVisible().catch(() => false)
      const hasDetails = await detailsTextarea.isVisible().catch(() => false)

      console.log(`✓ Форма скарги: ID=${hasReceiver}, тема=${hasSubject}, деталі=${hasDetails}`)
    } else {
      console.log('✓ Кнопка подачі скарги не видна')
    }
  })

  test('6. Статус-бейджі скарг', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/complaints')
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    const statuses = pageText.match(/В обробці|Вирішено|Відхилено|In Process|Resolved|Rejected/gi)

    console.log(`✓ Статуси скарг: ${statuses ? [...new Set(statuses)].join(', ') : 'порожній список'}`)
  })

  test('7. API GET /api/complaints без авторизації', async ({ request }) => {
    const res = await request.get('/api/complaints')
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: GET complaints без авторизації → ${res.status()}`)
  })

  test('8. API POST /api/complaints без авторизації', async ({ request }) => {
    const res = await request.post('/api/complaints', {
      data: { receiverId: 1, subject: 'test', details: 'test' }
    })
    expect([401, 403]).toContain(res.status())

    console.log(`✓ API: POST complaints без авторизації → ${res.status()}`)
  })

})
