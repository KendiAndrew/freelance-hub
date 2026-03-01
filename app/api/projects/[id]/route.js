import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

// отримати один проект
export async function GET(req, { params }) {
  try {
    const { id } = await params
    const result = await query(
      `SELECT p.*, c.first_name || ' ' || c.last_name AS client_name, c.city AS client_city
       FROM Project p JOIN Client c ON p.client_id = c.client_id
       WHERE p.project_id = $1`, [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Проект не знайдено' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка' }, { status: 500 })
  }
}

// оновити проект
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    const { id } = await params
    const { description, budget, deadline } = await req.json()

    const result = await query(
      `UPDATE Project SET description = $1, budget = $2, deadline = $3, updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $4 RETURNING *`,
      [description, budget, deadline, id]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: 'Помилка оновлення' }, { status: 500 })
  }
}

// видалити проект
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })

    const { id } = await params
    await query('DELETE FROM Project WHERE project_id = $1', [id])
    return NextResponse.json({ message: 'Видалено' })
  } catch (error) {
    return NextResponse.json({ error: 'Помилка видалення' }, { status: 500 })
  }
}
