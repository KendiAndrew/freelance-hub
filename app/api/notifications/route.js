import { withSession } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ count: 0, items: [] })
    const rq = withSession(session)

    let count = 0

    if (session.user.role === 'client') {
      // кількість нових заявок від виконавців (Pending deals)
      const res = await rq(
        `SELECT COUNT(*) FROM Deal WHERE client_id = $1 AND status = 'Pending'`,
        [session.user.profileId]
      )
      count = parseInt(res.rows[0].count)
    } else if (session.user.role === 'contractor') {
      // кількість угод що стали In Progress (клієнт прийняв заявку) за останню добу
      const res = await rq(
        `SELECT COUNT(*) FROM Deal
         WHERE contractor_id = $1 AND status = 'In Progress'
         AND updated_at > created_at + interval '1 second'
         AND updated_at > NOW() - interval '24 hours'`,
        [session.user.profileId]
      )
      count = parseInt(res.rows[0].count)
    }

    return NextResponse.json({ count, items: [] })
  } catch (error) {
    return NextResponse.json({ count: 0, items: [] })
  }
}

export async function PUT() {
  // без таблиці нотифікацій — no-op
  return NextResponse.json({ ok: true })
}
