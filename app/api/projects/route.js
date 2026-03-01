import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

// отримати список проектів
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const specialization = searchParams.get('specialization')
    const minBudget = searchParams.get('minBudget')
    const maxBudget = searchParams.get('maxBudget')

    let sql = `
      SELECT p.*, c.first_name || ' ' || c.last_name AS client_name, c.city AS client_city
      FROM Project p
      JOIN Client c ON p.client_id = c.client_id
      WHERE 1=1
    `
    const params = []
    let i = 1

    if (specialization) {
      sql += ` AND p.specialization::text = $${i++}`
      params.push(specialization)
    }
    if (minBudget) {
      sql += ` AND p.budget >= $${i++}`
      params.push(minBudget)
    }
    if (maxBudget) {
      sql += ` AND p.budget <= $${i++}`
      params.push(maxBudget)
    }

    sql += ' ORDER BY p.created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.log('Projects GET error:', error)
    return NextResponse.json({ error: 'Помилка отримання проектів' }, { status: 500 })
  }
}

// створити проект (тільки клієнт)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Доступ заборонено' }, { status: 403 })
    }

    const { description, specialization, budget, deadline } = await req.json()

    const result = await query(
      `INSERT INTO Project (client_id, specialization, description, budget, deadline)
       VALUES ($1, $2::project_specialization, $3, $4, $5) RETURNING *`,
      [session.user.profileId, specialization, description, budget, deadline]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.log('Projects POST error:', error)
    return NextResponse.json({ error: 'Помилка створення проекту' }, { status: 500 })
  }
}
