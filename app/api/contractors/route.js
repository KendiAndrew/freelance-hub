import { withSession } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    const rq = withSession(session)

    const { searchParams } = new URL(req.url)
    const specialization = searchParams.get('specialization')
    const city = searchParams.get('city')

    let sql = 'SELECT * FROM Contractor WHERE 1=1'
    const params = []
    let i = 1

    if (specialization) {
      sql += ` AND specialization = $${i++}`
      params.push(specialization)
    }
    if (city) {
      sql += ` AND city = $${i++}`
      params.push(city)
    }

    sql += ' ORDER BY rating DESC'

    const result = await rq(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
