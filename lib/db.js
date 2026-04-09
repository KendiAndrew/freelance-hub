import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// маппінг ролей додатку → ролей БД
const ROLE_MAP = {
  admin: 'freelance_admin',
  client: 'freelance_client',
  contractor: 'freelance_contractor',
  guest: 'freelance_guest',
}

// запит без зміни ролі (для аутентифікації та реєстрації)
export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

// запит з SET ROLE — доступ через БД-роль
async function roleQuery(role, text, params, login) {
  const dbRole = ROLE_MAP[role] || ROLE_MAP.guest
  const client = await pool.connect()
  try {
    await client.query(`SET ROLE ${dbRole}`)
    if (login) {
      await client.query(`SET app.current_login = '${login.replace(/'/g, "''")}'`)
    }
    const res = await client.query(text, params)
    return res
  } finally {
    await client.query('RESET ROLE')
    await client.query(`RESET app.current_login`)
    client.release()
  }
}

// створює функцію запиту прив'язану до сесії користувача
export function withSession(session) {
  const role = session?.user?.role || 'guest'
  const login = session?.user?.login
  return (text, params) => roleQuery(role, text, params, login)
}

export default pool
