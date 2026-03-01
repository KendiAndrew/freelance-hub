import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    let sql, params

    if (session.user.role === 'admin') {
      sql = `SELECT s.*, d.project_id,
             cl.first_name || ' ' || cl.last_name AS client_name,
             co.first_name || ' ' || co.last_name AS contractor_name
             FROM Safe s
             JOIN Deal d ON s.deal_id = d.deal_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             ORDER BY s.created_at DESC`
      params = []
    } else if (session.user.role === 'client') {
      sql = `SELECT s.*, d.project_id, co.first_name || ' ' || co.last_name AS contractor_name
             FROM Safe s JOIN Deal d ON s.deal_id = d.deal_id
             LEFT JOIN Contractor co ON d.contractor_id = co.contractor_id
             WHERE d.client_id = $1 ORDER BY s.created_at DESC`
      params = [session.user.profileId]
    } else {
      sql = `SELECT s.*, d.project_id, cl.first_name || ' ' || cl.last_name AS client_name
             FROM Safe s JOIN Deal d ON s.deal_id = d.deal_id
             LEFT JOIN Client cl ON d.client_id = cl.client_id
             WHERE d.contractor_id = $1 ORDER BY s.created_at DESC`
      params = [session.user.profileId]
    }

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
