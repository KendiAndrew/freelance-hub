import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
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

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
