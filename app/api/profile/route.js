import { withSession } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    let profile
    if (session.user.role === 'client') {
      profile = await rq(
        `SELECT c.*, u.login, u.email FROM Client c JOIN Users u ON c.user_id = u.user_id
         WHERE c.client_id = $1`, [session.user.profileId]
      )
    } else if (session.user.role === 'contractor') {
      profile = await rq(
        `SELECT co.*, u.login, u.email FROM Contractor co JOIN Users u ON co.user_id = u.user_id
         WHERE co.contractor_id = $1`, [session.user.profileId]
      )
    } else {
      profile = await rq(
        'SELECT user_id, login, email, role, created_at FROM Users WHERE user_id = $1', [session.user.id]
      )
    }

    return NextResponse.json(profile.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
    const rq = withSession(session)

    const data = await req.json()

    if (session.user.role === 'client') {
      await rq(
        `UPDATE Client SET first_name=$1, last_name=$2, city=$3, updated_at=CURRENT_TIMESTAMP
         WHERE client_id=$4`,
        [data.firstName, data.lastName, data.city, session.user.profileId]
      )
    } else if (session.user.role === 'contractor') {
      await rq(
        `UPDATE Contractor SET first_name=$1, last_name=$2, city=$3, specialization=$4,
         resume=$5, portfolio=$6, updated_at=CURRENT_TIMESTAMP WHERE contractor_id=$7`,
        [data.firstName, data.lastName, data.city, data.specialization, data.resume, data.portfolio, session.user.profileId]
      )
    }

    return NextResponse.json({ message: 'Профіль оновлено' })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
