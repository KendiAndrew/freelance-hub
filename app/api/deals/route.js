import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    let sql, params

    if (session.user.role === 'admin') {
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             cl.first_name || ' ' || cl.last_name AS client_name,
             co.first_name || ' ' || co.last_name AS contractor_name
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             ORDER BY d.created_at DESC`
      params = []
    } else if (session.user.role === 'client') {
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             co.first_name || ' ' || co.last_name AS contractor_name
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             WHERE d.client_id = $1 ORDER BY d.created_at DESC`
      params = [session.user.profileId]
    } else {
      sql = `SELECT d.*, p.description AS project_desc, p.specialization,
             cl.first_name || ' ' || cl.last_name AS client_name
             FROM Deal d
             LEFT JOIN Project p ON d.project_id = p.project_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             WHERE d.contractor_id = $1 ORDER BY d.created_at DESC`
      params = [session.user.profileId]
    }

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    const { projectId, contractorId, amount } = await req.json()

    // дістаємо client_id з проекту
    const project = await query('SELECT client_id FROM Project WHERE project_id = $1', [projectId])
    if (project.rows.length === 0) {
      return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
    }

    const result = await query(
      `INSERT INTO Deal (project_id, client_id, contractor_id, amount, status)
       VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
      [projectId, project.rows[0].client_id, contractorId, amount]
    )

    // створюємо ескроу
    await query(
      'INSERT INTO Safe (deal_id, amount) VALUES ($1, $2)',
      [result.rows[0].deal_id, amount]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.log('Deal POST error:', error)
    return NextResponse.json({ error: 'Помилка створення угоди' }, { status: 500 })
  }
}
