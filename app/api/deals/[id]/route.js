import { withSession } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    const { id } = await params
    const result = await rq(
      `SELECT d.*, p.description AS project_desc, p.specialization, p.budget AS project_budget,
       cl.first_name || ' ' || cl.last_name AS client_name,
       co.first_name || ' ' || co.last_name AS contractor_name
       FROM Deal d
       LEFT JOIN Project p ON d.project_id = p.project_id
       LEFT JOIN Client cl ON d.client_id = cl.client_id
       LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
       WHERE d.deal_id = $1`, [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Угоду не знайдено' }, { status: 404 })
    }

    // ескроу для цієї угоди
    const escrow = await rq('SELECT * FROM Safe WHERE deal_id = $1', [id])

    return NextResponse.json({ ...result.rows[0], escrow: escrow.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

// оновити статус угоди
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    const { id } = await params
    const { status } = await req.json()

    const result = await rq(
      `UPDATE Deal SET status = $1::deal_status,
       completion_date = CASE WHEN $1 = 'Completed' THEN CURRENT_DATE ELSE completion_date END,
       updated_at = CURRENT_TIMESTAMP
       WHERE deal_id = $2 RETURNING *`,
      [status, id]
    )

    // якщо завершено - виплачуємо ескроу
    if (status === 'Completed') {
      await rq(
        `UPDATE Safe SET status = 'Released', release_date = CURRENT_DATE WHERE deal_id = $1 AND status = 'Frozen'`,
        [id]
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
