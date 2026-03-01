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

    const stats = await query('SELECT * FROM project_statistics')
    const topContractors = await query('SELECT * FROM top_contractors LIMIT 10')
    const usersCount = await query('SELECT role, COUNT(*) as count FROM Users GROUP BY role')
    const totalDeals = await query('SELECT COUNT(*) as count FROM Deal')

    return NextResponse.json({
      projectStats: stats.rows,
      topContractors: topContractors.rows,
      usersByRole: usersCount.rows,
      totalDeals: totalDeals.rows[0].count,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
