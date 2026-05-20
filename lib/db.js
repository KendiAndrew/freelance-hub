import { Pool } from 'pg'

function makePool(user, password) {
  const url = new URL(process.env.DATABASE_URL)
  return new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.replace('/', ''),
    user,
    password,
    max: 5,
  })
}

// Окремий пул для кожної групової ролі БД
const pools = {
  freelance_admin:      makePool('freelance_admin',      process.env.DB_PASS_ADMIN      || 'admin_pass123'),
  freelance_client:     makePool('freelance_client',     process.env.DB_PASS_CLIENT     || 'client_pass123'),
  freelance_contractor: makePool('freelance_contractor', process.env.DB_PASS_CONTRACTOR || 'contractor_pass123'),
  freelance_guest:      makePool('freelance_guest',      process.env.DB_PASS_GUEST      || 'guest_pass123'),
}

const ROLE_MAP = {
  admin:      'freelance_admin',
  client:     'freelance_client',
  contractor: 'freelance_contractor',
  guest:      'freelance_guest',
}

// Пул postgres — тільки для реєстрації та автентифікації
const rootPool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function query(text, params) {
  return rootPool.query(text, params)
}

async function roleQuery(role, text, params, login) {
  const dbRole = ROLE_MAP[role] || 'freelance_guest'
  const pool = pools[dbRole]
  const client = await pool.connect()
  try {
    if (login) {
      await client.query(`SET app.current_login = '${login.replace(/'/g, "''")}'`)
    }
    const res = await client.query(text, params)
    return res
  } finally {
    await client.query('RESET app.current_login')
    client.release()
  }
}

export function withSession(session) {
  const role = session?.user?.role || 'guest'
  const login = session?.user?.login
  return (text, params) => roleQuery(role, text, params, login)
}

export default rootPool
