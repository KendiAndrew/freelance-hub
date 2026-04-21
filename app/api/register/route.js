import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

const GROUP_ROLE = {
  client:     'freelance_client',
  contractor: 'freelance_contractor',
}

export async function POST(req) {
  try {
    const { login, email, password, role, firstName, lastName, city, specialization } = await req.json()

    if (!login || !email || !password || !role) {
      return NextResponse.json({ error: 'Заповніть усі обовʼязкові поля' }, { status: 400 })
    }

    const existing = await query(
      'SELECT user_id FROM Users WHERE login = $1 OR email = $2',
      [login, email]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Користувач з таким логіном або email вже існує' }, { status: 400 })
    }

    // Записуємо користувача в таблицю Users (без пароля — він зберігається в PostgreSQL)
    const userResult = await query(
      'INSERT INTO Users (login, email, role) VALUES ($1, $2, $3) RETURNING user_id',
      [login, email, role]
    )
    const userId = userResult.rows[0].user_id

    // Створюємо PostgreSQL LOGIN-роль через функцію БД
    // Пароль зберігається в системному каталозі pg_authid, а не в таблиці Users
    const pgGroupRole = GROUP_ROLE[role] || 'freelance_guest'
    await query('SELECT create_user_role($1, $2, $3)', [login, password, pgGroupRole])

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
