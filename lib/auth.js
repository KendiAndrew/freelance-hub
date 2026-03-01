import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { query } from './db'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: { label: "Логін", type: "text" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null
        }

        try {
          // шукаємо користувача в бд
          const result = await query(
            'SELECT * FROM Users WHERE login = $1',
            [credentials.login]
          )

          const user = result.rows[0]
          if (!user) return null

          // перевіряємо пароль
          const isValid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!isValid) return null

          // дістаємо дані профілю залежно від ролі
          let profile = null
          if (user.role === 'client') {
            const res = await query('SELECT * FROM Client WHERE user_id = $1', [user.user_id])
            profile = res.rows[0]
          } else if (user.role === 'contractor') {
            const res = await query('SELECT * FROM Contractor WHERE user_id = $1', [user.user_id])
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
        } catch (error) {
          console.log('Auth error:', error)
          return null
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
