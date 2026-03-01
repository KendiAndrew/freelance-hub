'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      login,
      password,
      redirect: false
    })

    if (res?.error) {
      setError('Невірний логін або пароль')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl hero-gradient flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Вхід в систему</h1>
          <p className="text-gray-500 mt-1">Введіть свої дані для входу</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Логін</label>
            <input
              type="text"
              className="input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введіть логін"
              required
            />
          </div>

          <div className="mb-6">
            <label className="label">Пароль</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-500 text-sm">
          Немає акаунту?{' '}
          <a href="/register" className="text-indigo-600 font-semibold hover:underline">
            Зареєструватися
          </a>
        </div>
      </div>
    </div>
  )
}
