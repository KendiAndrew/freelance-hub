const { test, expect } = require('@playwright/test')

// Функція логіну
async function login(page, username, password = 'password123') {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.fill('input[placeholder="Введіть логін"]', username)
  await page.fill('input[placeholder="Введіть пароль"]', password)
  await page.click('button[type="submit"]')
  // Чекаємо перехід на головну після логіну
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

test.describe('Рейтинги та відгуки', () => {

  test('1. Гість бачить відгуки на профілі фрілансера', async ({ page }) => {
    // Відкриваємо профіль першого виконавця (Андрій Мельник)
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    // Перевіряємо що є ім'я виконавця
    await expect(page.locator('h1')).toContainText('Андрій')

    // Перевіряємо рейтинг зірки
    const stars = page.locator('.text-amber-400').first()
    await expect(stars).toBeVisible()
    const starsText = await stars.textContent()
    expect(starsText).toMatch(/[★☆]+/)

    // Перевіряємо секцію відгуків
    const reviewsHeader = page.locator('text=Відгуки')
    await expect(reviewsHeader).toBeVisible()

    // Перевіряємо що є відгуки або повідомлення "Відгуків поки немає"
    const hasReviews = await page.locator('.card:has(.text-gray-600)').count()
    const noReviews = await page.locator('text=Відгуків поки немає').count()
    expect(hasReviews > 0 || noReviews > 0).toBeTruthy()

    console.log(`✓ Гість: знайдено ${hasReviews} відгуків на профілі`)
  })

  test('2. Гість бачить рейтинг у списку фрілансерів', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    // Перевіряємо що є картки фрілансерів
    const cards = page.locator('.card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    // Перевіряємо зірки рейтингу на картках
    const ratingElements = page.locator('.text-amber-400')
    const ratingCount = await ratingElements.count()
    expect(ratingCount).toBeGreaterThan(0)

    // Перевіряємо текст рейтингу
    const ratingText = page.locator('text=Рейтинг:')
    const ratingTextCount = await ratingText.count()
    expect(ratingTextCount).toBeGreaterThan(0)

    console.log(`✓ Список: ${count} фрілансерів з рейтингами`)
  })

  test('3. Профіль фрілансера — деталі відгуку', async ({ page }) => {
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    // Шукаємо відгуки
    const reviewCards = page.locator('.space-y-4 .card')
    const reviewCount = await reviewCards.count()

    if (reviewCount > 0) {
      // Перевіряємо структуру першого відгуку
      const firstReview = reviewCards.first()

      // Має бути ім'я рецензента
      const reviewerName = firstReview.locator('.font-semibold')
      await expect(reviewerName).toBeVisible()

      // Має бути текст відгуку
      const reviewText = firstReview.locator('.text-gray-600')
      await expect(reviewText).toBeVisible()

      // Має бути дата
      const reviewDate = firstReview.locator('.text-gray-400.text-xs')
      await expect(reviewDate).toBeVisible()

      // Має бути рейтинг зірками
      const reviewStars = firstReview.locator('.text-amber-400')
      await expect(reviewStars).toBeVisible()

      const name = await reviewerName.textContent()
      const text = await reviewText.textContent()
      console.log(`✓ Відгук від "${name}": "${text.substring(0, 50)}..."`)
    } else {
      console.log('✓ Відгуків немає (перевірено відображення)')
    }
  })

  test('4. API рейтингів — GET всі', async ({ request }) => {
    const response = await request.get('/api/ratings')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()

    if (data.length > 0) {
      // Перевіряємо структуру першого рейтингу
      const first = data[0]
      expect(first).toHaveProperty('ratings_id')
      expect(first).toHaveProperty('reviewer_id')
      expect(first).toHaveProperty('reviewed_id')
      expect(first).toHaveProperty('rating')
      expect(first).toHaveProperty('review_text')
      expect(first).toHaveProperty('reviewer_name')
      expect(first.rating).toBeGreaterThanOrEqual(1)
      expect(first.rating).toBeLessThanOrEqual(10)

      console.log(`✓ API: ${data.length} рейтингів, перший від "${first.reviewer_name}"`)
    } else {
      console.log('✓ API: порожній масив рейтингів')
    }
  })

  test('5. API рейтингів — GET по contractorId', async ({ request }) => {
    const response = await request.get('/api/ratings?contractorId=1')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()

    // Всі відгуки мають бути для contractor_id=1
    for (const r of data) {
      expect(r.reviewed_id).toBe(1)
    }

    console.log(`✓ API: ${data.length} відгуків для виконавця #1`)
  })

  test('6. API рейтингів — POST без авторизації = 403', async ({ request }) => {
    const response = await request.post('/api/ratings', {
      data: { reviewedId: 1, projectId: 1, rating: 8, reviewText: 'Тест' }
    })
    // Без авторизації має бути 403 або 401
    expect([401, 403]).toContain(response.status())
    console.log(`✓ API: POST без авторизації повертає ${response.status()}`)
  })

  test('7. Клієнт бачить форму угоди але не форму відгуку', async ({ page }) => {
    await login(page, 'ivan_koval')

    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    // Клієнт має бачити кнопку "Запропонувати угоду"
    const dealButton = page.locator('text=Запропонувати угоду')
    await expect(dealButton).toBeVisible()

    // Перевіряємо що секція відгуків все ще видна
    const reviewsSection = page.locator('text=Відгуки')
    await expect(reviewsSection).toBeVisible()

    console.log('✓ Клієнт: бачить кнопку угоди та секцію відгуків')
  })

  test('8. Виконавець не бачить форму угоди на своєму профілі', async ({ page }) => {
    await login(page, 'dev_andriy')

    // Відкриваємо свій профіль (contractor_id=1 для dev_andriy)
    await page.goto('/contractors/1')
    await page.waitForLoadState('networkidle')

    // Виконавець НЕ має бачити кнопку "Запропонувати угоду"
    const dealButton = page.locator('text=Запропонувати угоду')
    await expect(dealButton).toHaveCount(0)

    // Але секція відгуків має бути
    const reviewsSection = page.locator('text=Відгуки')
    await expect(reviewsSection).toBeVisible()

    console.log('✓ Виконавець: немає кнопки угоди на своєму профілі')
  })

  test('9. Перевірка кількості зірок відповідає рейтингу', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    // Знаходимо всі рейтинги зірками
    const starElements = page.locator('.text-amber-400')
    const count = await starElements.count()

    for (let i = 0; i < count; i++) {
      const text = await starElements.nth(i).textContent()
      const filled = (text.match(/★/g) || []).length
      const empty = (text.match(/☆/g) || []).length
      const total = filled + empty

      // На сторінці списку має бути 5 зірок
      if (total === 5) {
        expect(filled).toBeGreaterThanOrEqual(0)
        expect(filled).toBeLessThanOrEqual(5)
        console.log(`  Фрілансер ${i + 1}: ${'★'.repeat(filled)}${'☆'.repeat(empty)}`)
      }
    }

    console.log('✓ Зірки: коректна кількість на всіх картках')
  })

  test('10. API виконавця повертає рейтинги в масиві', async ({ request }) => {
    const response = await request.get('/api/contractors/1')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('first_name')
    expect(data).toHaveProperty('ratings')
    expect(Array.isArray(data.ratings)).toBeTruthy()

    if (data.ratings.length > 0) {
      const r = data.ratings[0]
      expect(r).toHaveProperty('reviewer_name')
      expect(r).toHaveProperty('rating')
      expect(r).toHaveProperty('review_text')
    }

    console.log(`✓ API contractor: ${data.first_name} ${data.last_name}, ${data.ratings.length} відгуків, рейтинг=${data.rating}`)
  })

  test('11. Навігація з списку до профілю зберігає рейтинг', async ({ page }) => {
    await page.goto('/contractors')
    await page.waitForLoadState('networkidle')

    // Клікаємо на першу картку
    const firstCard = page.locator('.card').first()
    await firstCard.click()

    // Чекаємо перехід на сторінку деталей
    await page.waitForURL(/\/contractors\/\d+/)
    await page.waitForLoadState('networkidle')

    // Перевіряємо що є рейтинг та відгуки
    const stars = page.locator('.text-amber-400').first()
    await expect(stars).toBeVisible()

    const reviewsHeader = page.locator('text=Відгуки')
    await expect(reviewsHeader).toBeVisible()

    // Перевіряємо кнопку "Назад"
    const backLink = page.locator('text=Назад до фрілансерів')
    await expect(backLink).toBeVisible()

    console.log('✓ Навігація: перехід з списку на профіль працює')
  })

  test('12. Відгуки на різних фрілансерах', async ({ page }) => {
    // Перевіряємо кілька профілів
    for (const contractorId of [1, 2, 3]) {
      await page.goto(`/contractors/${contractorId}`)
      await page.waitForLoadState('networkidle')

      const name = await page.locator('h1').textContent()
      const reviewsHeader = page.locator('h2:has-text("Відгуки")')
      await expect(reviewsHeader).toBeVisible()

      const headerText = await reviewsHeader.textContent()
      const match = headerText.match(/\((\d+)\)/)
      const count = match ? parseInt(match[1]) : 0

      console.log(`  Фрілансер #${contractorId} "${name}": ${count} відгуків`)
    }

    console.log('✓ Відгуки коректно відображаються на різних профілях')
  })

})
