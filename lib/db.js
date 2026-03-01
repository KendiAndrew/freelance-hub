import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// проста функція для запитів до бд
export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

export default pool
