'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ description: '', specialization: 'Web Development', budget: '', deadline: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!session || session.user.role !== 'client') {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Тільки замовники можуть створювати проекти</div>
        <a href="/login" className="btn-primary mt-4 inline-block">Увійти</a>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Помилка створення')
        setLoading(false)
        return
      }

      router.push('/projects')
    } catch (err) {
      setError('Помилка зʼєднання')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <a href="/projects" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Назад до проектів</a>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Новий проект</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Спеціалізація</label>
            <select className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
              <option value="Web Development">Веб-розробка</option>
              <option value="Design">Дизайн</option>
              <option value="Writing">Копірайтинг</option>
              <option value="Marketing">Маркетинг</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="label">Опис проекту</label>
            <textarea className="input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Детально опишіть задачу..." required />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Бюджет (грн)</label>
              <input type="number" className="input" min="500" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="Від 500 грн" required />
            </div>
            <div>
              <label className="label">Дедлайн</label>
              <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? 'Створення...' : 'Створити проект'}
          </button>
        </form>
      </div>
    </div>
  )
}
