// Спільні хелпери для тестів

async function login(page, username, password = 'password123') {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.fill('input[placeholder="Введіть логін"]', username)
  await page.fill('input[placeholder="Введіть пароль"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

async function logout(page) {
  const logoutBtn = page.locator('text=Вийти')
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await page.waitForLoadState('networkidle')
  }
}

module.exports = { login, logout }
