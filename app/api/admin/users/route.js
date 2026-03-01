import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Тільки адмін' }, { status: 403 })
    }

    const result = await query(
      `SELECT u.user_id, u.login, u.email, u.role, u.created_at,
       COALESCE(cl.first_name, co.first_name, 'Admin') AS first_name,
       COALESCE(cl.last_name, co.last_name, '') AS last_name
       FROM Users u
       LEFT JOIN Client cl ON u.user_id = cl.user_id
       LEFT JOIN Contractor co ON u.user_id = co.user_id
       ORDER BY u.created_at DESC`
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Тільки адмін' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')

    await query('DELETE FROM Users WHERE user_id = $1', [userId])
    return NextResponse.json({ message: 'Видалено' })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
