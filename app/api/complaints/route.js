import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    let complaints = []

    if (session.user.role === 'admin') {
      // адмін бачить все
      const cc = await query(`SELECT cc.*, 'client' AS type, cl.first_name || ' ' || cl.last_name AS sender_name,
        co.first_name || ' ' || co.last_name AS receiver_name
        FROM ComplaintClient cc
        JOIN Client cl ON cc.sender_id = cl.client_id
        JOIN Contractor co ON cc.receiver_id = co.contractor_id ORDER BY cc.created_at DESC`)
      const cr = await query(`SELECT cr.*, 'contractor' AS type, co.first_name || ' ' || co.last_name AS sender_name,
        cl.first_name || ' ' || cl.last_name AS receiver_name
        FROM ComplaintContractor cr
        JOIN Contractor co ON cr.sender_id = co.contractor_id
        JOIN Client cl ON cr.receiver_id = cl.client_id ORDER BY cr.created_at DESC`)
      complaints = [...cc.rows, ...cr.rows]
    } else if (session.user.role === 'client') {
      const res = await query(
        `SELECT cc.*, co.first_name || ' ' || co.last_name AS receiver_name
         FROM ComplaintClient cc JOIN Contractor co ON cc.receiver_id = co.contractor_id
         WHERE cc.sender_id = $1 ORDER BY cc.created_at DESC`,
        [session.user.profileId]
      )
      complaints = res.rows
    } else {
      const res = await query(
        `SELECT cr.*, cl.first_name || ' ' || cl.last_name AS receiver_name
         FROM ComplaintContractor cr JOIN Client cl ON cr.receiver_id = cl.client_id
         WHERE cr.sender_id = $1 ORDER BY cr.created_at DESC`,
        [session.user.profileId]
      )
      complaints = res.rows
    }

    return NextResponse.json(complaints)
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    const { receiverId, subject, details } = await req.json()

    let result
    if (session.user.role === 'client') {
      result = await query(
        'INSERT INTO ComplaintClient (sender_id, receiver_id, subject, details) VALUES ($1, $2, $3, $4) RETURNING *',
        [session.user.profileId, receiverId, subject, details]
      )
    } else if (session.user.role === 'contractor') {
      result = await query(
        'INSERT INTO ComplaintContractor (sender_id, receiver_id, subject, details) VALUES ($1, $2, $3, $4) RETURNING *',
        [session.user.profileId, receiverId, subject, details]
      )
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}
