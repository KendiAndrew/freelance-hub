import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { login, email, password, role, firstName, lastName, city, specialization } = await req.json()

    // перевірка чи є вже такий юзер
    const existing = await query('SELECT user_id FROM Users WHERE login = $1 OR email = $2', [login, email])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Користувач з таким логіном або email вже існує' }, { status: 400 })
    }

    // хешуємо пароль
    const hash = await bcrypt.hash(password, 10)

    // створюємо юзера
    const userResult = await query(
      'INSERT INTO Users (login, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [login, email, hash, role]
    )
    const userId = userResult.rows[0].user_id

    // створюємо профіль
    if (role === 'client') {
      await query(
        'INSERT INTO Client (user_id, first_name, last_name, city) VALUES ($1, $2, $3, $4)',
        [userId, firstName, lastName, city || null]
      )
    } else if (role === 'contractor') {
      await query(
        'INSERT INTO Contractor (user_id, first_name, last_name, city, specialization) VALUES ($1, $2, $3, $4, $5)',
        [userId, firstName, lastName, city || null, specialization || null]
      )
    }

    return NextResponse.json({ message: 'Реєстрація успішна!' }, { status: 201 })
  } catch (error) {
    console.log('Register error:', error)
    return NextResponse.json({ error: 'Помилка реєстрації' }, { status: 500 })
  }
}
