import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

// оновити статус скарги (адмін)
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Тільки адмін' }, { status: 403 })
    }

    const { id } = await params
    const { status, type } = await req.json()

    const table = type === 'client' ? 'ComplaintClient' : 'ComplaintContractor'
    const result = await query(
      `UPDATE ${table} SET status = $1::complaint_status,
       resolved_at = CASE WHEN $1 != 'In Process' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE complaint_id = $2 RETURNING *`,
      [status, id]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
