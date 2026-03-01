'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    login: '', email: '', password: '', confirmPassword: '', role: 'client',
    firstName: '', lastName: '', city: '', specialization: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // перевірка паролів
    if (form.password !== form.confirmPassword) {
      setError('Паролі не збігаються')
      return
    }

    if (form.password.length < 6) {
      setError('Пароль має бути мінімум 6 символів')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Помилка реєстрації')
        setLoading(false)
        return
      }

      // автоматичний вхід після реєстрації
      const result = await signIn('credentials', {
        login: form.login,
        password: form.password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/profile')
      } else {
        // якщо автовхід не спрацював — перенаправляємо на логін
        router.push('/login')
      }
    } catch (err) {
      setError('Помилка зʼєднання з сервером')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl hero-gradient flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Реєстрація</h1>
          <p className="text-gray-500 mt-1">Створіть новий акаунт</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* роль */}
          <div className="mb-5">
            <label className="label">Роль</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'client' })}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  form.role === 'client'
                    ? 'hero-gradient text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Замовник
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'contractor' })}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  form.role === 'contractor'
                    ? 'hero-gradient text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Виконавець
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Імʼя</label>
              <input name="firstName" className="input" value={form.firstName} onChange={handleChange} placeholder="Іван" required />
            </div>
            <div>
              <label className="label">Прізвище</label>
              <input name="lastName" className="input" value={form.lastName} onChange={handleChange} placeholder="Петренко" required />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Логін</label>
            <input name="login" className="input" value={form.login} onChange={handleChange} placeholder="ivan_petrenko" required />
          </div>

          <div className="mb-4">
            <label className="label">Email</label>
            <input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="ivan@example.com" required />
          </div>

          <div className="mb-4">
            <label className="label">Пароль</label>
            <input name="password" type="password" className="input" value={form.password} onChange={handleChange} placeholder="Мінімум 6 символів" required />
          </div>

          <div className="mb-4">
            <label className="label">Підтвердження паролю</label>
            <input name="confirmPassword" type="password" className="input" value={form.confirmPassword} onChange={handleChange} placeholder="Повторіть пароль" required />
          </div>

          <div className="mb-4">
            <label className="label">Місто</label>
            <input name="city" className="input" value={form.city} onChange={handleChange} placeholder="Київ" />
          </div>

          {form.role === 'contractor' && (
            <div className="mb-4">
              <label className="label">Спеціалізація</label>
              <select name="specialization" className="input" value={form.specialization} onChange={handleChange}>
                <option value="">Оберіть спеціалізацію</option>
                <option value="Web Development">Веб-розробка</option>
                <option value="Design">Дизайн</option>
                <option value="Writing">Копірайтинг</option>
                <option value="Marketing">Маркетинг</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
          >
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-500 text-sm">
          Вже є акаунт?{' '}
          <a href="/login" className="text-indigo-600 font-semibold hover:underline">
            Увійти
          </a>
        </div>
      </div>
    </div>
  )
}
