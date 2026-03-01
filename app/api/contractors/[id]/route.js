import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const { id } = await params
    const contractor = await query('SELECT * FROM Contractor WHERE contractor_id = $1', [id])
    if (contractor.rows.length === 0) {
      return NextResponse.json({ error: 'Не знайдено' }, { status: 404 })
    }

    // також дістаємо рейтинги
    const ratings = await query(
      `SELECT r.*, cl.first_name || ' ' || cl.last_name AS reviewer_name
       FROM Ratings r JOIN Client cl ON r.reviewer_id = cl.client_id
       WHERE r.reviewed_id = $1 ORDER BY r.created_at DESC`, [id]
    )

    return NextResponse.json({
      ...contractor.rows[0],
      ratings: ratings.rows
    })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'contractor') {
      return NextResponse.json({ error: 'Доступ заборонено' }, { status: 403 })
    }
    const { id } = await params
    const { specialization, resume, portfolio, city } = await req.json()

    const result = await query(
      `UPDATE Contractor SET specialization=$1, resume=$2, portfolio=$3, city=$4, updated_at=CURRENT_TIMESTAMP
       WHERE contractor_id=$5 RETURNING *`,
      [specialization, resume, portfolio, city, id]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
