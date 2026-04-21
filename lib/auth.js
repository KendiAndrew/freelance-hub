import CredentialsProvider from 'next-auth/providers/credentials'
import { Client } from 'pg'

// Параметри підключення до БД (без логіна/пароля — вони задаються при автентифікації)
function getDbConfig(login, password) {
  const url = new URL(process.env.DATABASE_URL)
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.replace('/', ''),
    user: login,
    password: password,
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: { label: "Логін", type: "text" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null

        // Підключаємось до PostgreSQL від імені користувача.
        // PostgreSQL сам перевіряє пароль — якщо невірний, connect() кине виняток.
        const client = new Client(getDbConfig(credentials.login, credentials.password))

        try {
          await client.connect()

          // Зчитуємо дані користувача (password_hash відсутній — не потрібен)
          const result = await client.query(
            'SELECT user_id, login, email, role FROM Users WHERE login = $1',
            [credentials.login]
          )
          const user = result.rows[0]
          if (!user) return null

          // Завантажуємо профіль залежно від ролі
          let profile = null
          if (user.role === 'client') {
            const res = await client.query(
              'SELECT * FROM Client WHERE user_id = $1',
              [user.user_id]
            )
            profile = res.rows[0]
          } else if (user.role === 'contractor') {
            const res = await client.query(
              'SELECT * FROM Contractor WHERE user_id = $1',
              [user.user_id]
            )
            profile = res.rows[0]
          }

          return {
            id: user.user_id,
            login: user.login,
            email: user.email,
            role: user.role,
            profileId: profile ? (profile.client_id || profile.contractor_id) : null,
            firstName: profile?.first_name || 'Admin',
            lastName: profile?.last_name || '',
          }
        } catch {
          // PostgreSQL відхилив підключення: невірний пароль або роль не існує
          return null
        } finally {
          try { await client.end() } catch {}
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.login = user.login
        token.profileId = user.profileId
        token.firstName = user.firstName
        token.lastName = user.lastName
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub
      session.user.role = token.role
      session.user.login = token.login
      session.user.profileId = token.profileId
      session.user.firstName = token.firstName
      session.user.lastName = token.lastName
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
