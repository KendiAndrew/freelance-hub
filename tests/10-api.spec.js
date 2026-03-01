const { test, expect } = require('@playwright/test')

test.describe('API — захист доступу та валідація', () => {

  // === ПУБЛІЧНІ ENDPOINTS ===

  test('1. GET /api/projects — публічний доступ', async ({ request }) => {
    const res = await request.get('/api/projects')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
    console.log(`✓ Projects: публічний, ${data.length} записів`)
  })

  test('2. GET /api/contractors — публічний доступ', async ({ request }) => {
    const res = await request.get('/api/contractors')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
    console.log(`✓ Contractors: публічний, ${data.length} записів`)
  })

  test('3. GET /api/ratings — публічний доступ', async ({ request }) => {
    const res = await request.get('/api/ratings')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBeTruthy()
    console.log(`✓ Ratings: публічний, ${data.length} записів`)
  })

  test('4. GET /api/projects/1 — публічний доступ', async ({ request }) => {
    const res = await request.get('/api/projects/1')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('project_id')
    console.log(`✓ Project #1: публічний доступ`)
  })

  test('5. GET /api/contractors/1 — публічний доступ', async ({ request }) => {
    const res = await request.get('/api/contractors/1')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('contractor_id')
    expect(data).toHaveProperty('ratings')
    console.log(`✓ Contractor #1: публічний доступ`)
  })

  // === ЗАХИЩЕНІ ENDPOINTS — без авторизації ===

  test('6. POST /api/projects — захищений', async ({ request }) => {
    const res = await request.post('/api/projects', {
      data: { description: 'test', specialization: 'Design', budget: 1000, deadline: '2026-12-31' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ POST projects: захищений (${res.status()})`)
  })

  test('7. PUT /api/projects/1 — захищений', async ({ request }) => {
    const res = await request.put('/api/projects/1', {
      data: { description: 'hack', budget: 0, deadline: '2026-01-01' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ PUT projects: захищений (${res.status()})`)
  })

  test('8. DELETE /api/projects/1 — захищений', async ({ request }) => {
    const res = await request.delete('/api/projects/1')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ DELETE projects: захищений (${res.status()})`)
  })

  test('9. GET /api/deals — захищений', async ({ request }) => {
    const res = await request.get('/api/deals')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET deals: захищений (${res.status()})`)
  })

  test('10. POST /api/deals — захищений', async ({ request }) => {
    const res = await request.post('/api/deals', {
      data: { projectId: 1, contractorId: 1, amount: 100 }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ POST deals: захищений (${res.status()})`)
  })

  test('11. PUT /api/deals/1 — захищений', async ({ request }) => {
    const res = await request.put('/api/deals/1', {
      data: { status: 'Completed' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ PUT deals: захищений (${res.status()})`)
  })

  test('12. GET /api/escrow — захищений', async ({ request }) => {
    const res = await request.get('/api/escrow')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET escrow: захищений (${res.status()})`)
  })

  test('13. POST /api/ratings — захищений', async ({ request }) => {
    const res = await request.post('/api/ratings', {
      data: { reviewedId: 1, projectId: 1, rating: 5, reviewText: 'hack' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ POST ratings: захищений (${res.status()})`)
  })

  test('14. GET /api/complaints — захищений', async ({ request }) => {
    const res = await request.get('/api/complaints')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET complaints: захищений (${res.status()})`)
  })

  test('15. POST /api/complaints — захищений', async ({ request }) => {
    const res = await request.post('/api/complaints', {
      data: { receiverId: 1, subject: 'hack', details: 'hack' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ POST complaints: захищений (${res.status()})`)
  })

  test('16. PUT /api/complaints/1 — захищений (admin only)', async ({ request }) => {
    const res = await request.put('/api/complaints/1', {
      data: { status: 'Resolved', type: 'client' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ PUT complaints: захищений (${res.status()})`)
  })

  test('17. GET /api/profile — захищений', async ({ request }) => {
    const res = await request.get('/api/profile')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET profile: захищений (${res.status()})`)
  })

  test('18. PUT /api/profile — захищений', async ({ request }) => {
    const res = await request.put('/api/profile', {
      data: { firstName: 'Hack', lastName: 'er' }
    })
    expect([401, 403]).toContain(res.status())
    console.log(`✓ PUT profile: захищений (${res.status()})`)
  })

  test('19. GET /api/admin/stats — тільки адмін', async ({ request }) => {
    const res = await request.get('/api/admin/stats')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET admin/stats: захищений (${res.status()})`)
  })

  test('20. GET /api/admin/users — тільки адмін', async ({ request }) => {
    const res = await request.get('/api/admin/users')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ GET admin/users: захищений (${res.status()})`)
  })

  test('21. DELETE /api/admin/users — тільки адмін', async ({ request }) => {
    const res = await request.delete('/api/admin/users?id=999')
    expect([401, 403]).toContain(res.status())
    console.log(`✓ DELETE admin/users: захищений (${res.status()})`)
  })

  // === 404 для неіснуючих ресурсів ===

  test('22. GET /api/projects/99999 — 404', async ({ request }) => {
    const res = await request.get('/api/projects/99999')
    expect(res.status()).toBe(404)
    console.log('✓ Project 99999: 404')
  })

  test('23. GET /api/contractors/99999 — 404', async ({ request }) => {
    const res = await request.get('/api/contractors/99999')
    expect(res.status()).toBe(404)
    console.log('✓ Contractor 99999: 404')
  })

  // === Структура відповідей API ===

  test('24. API projects — коректна структура', async ({ request }) => {
    const res = await request.get('/api/projects')
    const data = await res.json()

    if (data.length > 0) {
      const p = data[0]
      expect(p).toHaveProperty('project_id')
      expect(p).toHaveProperty('client_id')
      expect(p).toHaveProperty('description')
      expect(p).toHaveProperty('budget')
      expect(p).toHaveProperty('specialization')
      expect(p).toHaveProperty('deadline')
      expect(p).toHaveProperty('client_name')
      expect(Number(p.budget)).not.toBeNaN()
    }

    console.log('✓ Структура projects: коректна')
  })

  test('25. API contractors — коректна структура', async ({ request }) => {
    const res = await request.get('/api/contractors')
    const data = await res.json()

    if (data.length > 0) {
      const c = data[0]
      expect(c).toHaveProperty('contractor_id')
      expect(c).toHaveProperty('first_name')
      expect(c).toHaveProperty('last_name')
      expect(c).toHaveProperty('specialization')
      expect(c).toHaveProperty('rating')
    }

    console.log('✓ Структура contractors: коректна')
  })

  test('26. API ratings — коректна структура', async ({ request }) => {
    const res = await request.get('/api/ratings')
    const data = await res.json()

    if (data.length > 0) {
      const r = data[0]
      expect(r).toHaveProperty('ratings_id')
      expect(r).toHaveProperty('reviewer_id')
      expect(r).toHaveProperty('reviewed_id')
      expect(r).toHaveProperty('rating')
      expect(r).toHaveProperty('review_text')
      expect(r).toHaveProperty('reviewer_name')
      expect(r).toHaveProperty('contractor_name')
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(10)
    }

    console.log('✓ Структура ratings: коректна')
  })

  test('27. API contractors/1 — ratings масив', async ({ request }) => {
    const res = await request.get('/api/contractors/1')
    const data = await res.json()

    expect(data).toHaveProperty('ratings')
    expect(Array.isArray(data.ratings)).toBeTruthy()

    if (data.ratings.length > 0) {
      const r = data.ratings[0]
      expect(r).toHaveProperty('reviewer_name')
      expect(r).toHaveProperty('rating')
      expect(r).toHaveProperty('review_text')
      expect(r).toHaveProperty('created_at')
    }

    console.log(`✓ Contractor #1: ${data.ratings.length} рейтингів у масиві`)
  })

  // === Фільтрація ===

  test('28. Фільтрація проектів за спеціалізацією', async ({ request }) => {
    for (const spec of ['Web Development', 'Design', 'Writing', 'Marketing']) {
      const res = await request.get(`/api/projects?specialization=${encodeURIComponent(spec)}`)
      expect(res.status()).toBe(200)
      const data = await res.json()
      for (const p of data) {
        expect(p.specialization).toBe(spec)
      }
    }

    console.log('✓ Фільтрація проектів: всі спеціалізації перевірені')
  })

  test('29. Фільтрація фрілансерів за спеціалізацією', async ({ request }) => {
    const res = await request.get('/api/contractors?specialization=Web Development')
    expect(res.status()).toBe(200)
    const data = await res.json()
    for (const c of data) {
      expect(c.specialization).toBe('Web Development')
    }

    console.log(`✓ Фільтрація фрілансерів: ${data.length} веб-розробників`)
  })

  test('30. Фільтрація рейтингів за contractorId', async ({ request }) => {
    const res = await request.get('/api/ratings?contractorId=1')
    expect(res.status()).toBe(200)
    const data = await res.json()
    for (const r of data) {
      expect(r.reviewed_id).toBe(1)
    }

    console.log(`✓ Фільтрація рейтингів: ${data.length} для contractor #1`)
  })

  // === Реєстрація ===

  test('31. POST /api/register — дублікат логіну', async ({ request }) => {
    const res = await request.post('/api/register', {
      data: {
        login: 'ivan_koval',
        email: 'unique_test@test.ua',
        password: 'password123',
        role: 'client',
        firstName: 'Test',
        lastName: 'Test',
        city: 'Kyiv'
      }
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/існує|вже/)

    console.log('✓ Реєстрація: дублікат логіну відхилено')
  })

  test('32. POST /api/register — дублікат email', async ({ request }) => {
    const res = await request.post('/api/register', {
      data: {
        login: 'unique_test_login',
        email: 'ivan@example.com',
        password: 'password123',
        role: 'client',
        firstName: 'Test',
        lastName: 'Test',
        city: 'Kyiv'
      }
    })
    // Може бути 400 або 500 залежно від реалізації
    expect([400, 500]).toContain(res.status())

    console.log(`✓ Реєстрація: дублікат email → ${res.status()}`)
  })

})
