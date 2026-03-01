import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const contractorId = searchParams.get('contractorId')

    let sql = `SELECT r.*, cl.first_name || ' ' || cl.last_name AS reviewer_name,
               co.first_name || ' ' || co.last_name AS contractor_name
               FROM Ratings r
               JOIN Client cl ON r.reviewer_id = cl.client_id
               JOIN Contractor co ON r.reviewed_id = co.contractor_id`
    const params = []

    if (contractorId) {
      sql += ' WHERE r.reviewed_id = $1'
      params.push(contractorId)
    }
    sql += ' ORDER BY r.created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Тільки клієнти можуть залишати відгуки' }, { status: 403 })
    }

    const { reviewedId, projectId, rating, reviewText } = await req.json()

    const result = await query(
      `INSERT INTO Ratings (reviewer_id, reviewed_id, project_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [session.user.profileId, reviewedId, projectId, rating, reviewText]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.log('Rating error:', error)
    return NextResponse.json({ error: 'Помилка створення відгуку' }, { status: 500 })
  }
}
