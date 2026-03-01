'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setProfile(data)
          setForm({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            city: data.city || '',
            specialization: data.specialization || '',
            resume: data.resume || '',
            portfolio: data.portfolio || ''
          })
          setLoading(false)
        })
    }
  }, [session])

  async function handleSave(e) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMessage('Профіль оновлено!')
      setEditing(false)
      // перезавантажуємо
      const data = await fetch('/api/profile').then(r => r.json())
      setProfile(data)
    }
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Увійдіть для перегляду профілю</div>
        <a href="/login" className="btn-primary mt-4 inline-block">Увійти</a>
      </div>
    )
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Мій профіль</h1>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>
      )}

      <div className="card">
        {/* аватар */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-gray-500">{profile?.login} &middot; {profile?.email}</p>
            <span className="badge badge-purple mt-1">{session.user.role === 'client' ? 'Замовник' : session.user.role === 'contractor' ? 'Виконавець' : 'Адміністратор'}</span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Імʼя</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Прізвище</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Місто</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>

            {session.user.role === 'contractor' && (
              <>
                <div className="mb-4">
                  <label className="label">Спеціалізація</label>
                  <select className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                    <option value="">Не вказано</option>
                    <option value="Web Development">Веб-розробка</option>
                    <option value="Design">Дизайн</option>
                    <option value="Writing">Копірайтинг</option>
                    <option value="Marketing">Маркетинг</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="label">Резюме</label>
                  <textarea className="input" rows={3} value={form.resume} onChange={e => setForm({ ...form, resume: e.target.value })} />
                </div>
                <div className="mb-4">
                  <label className="label">Портфоліо</label>
                  <textarea className="input" rows={2} value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Зберегти</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Місто</div>
                <div className="font-semibold text-gray-700">{profile?.city || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Рейтинг</div>
                <div className="font-semibold text-gray-700">{((profile?.rating || 0) / 10).toFixed(1)}/10</div>
              </div>
            </div>

            {session.user.role === 'contractor' && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-gray-400 text-sm mb-1">Спеціалізація</div>
                  <div className="font-semibold text-gray-700">{profile?.specialization || '—'}</div>
                </div>
                {profile?.resume && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-gray-400 text-sm mb-1">Резюме</div>
                    <div className="text-gray-700">{profile.resume}</div>
                  </div>
                )}
                {profile?.portfolio && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-gray-400 text-sm mb-1">Портфоліо</div>
                    <div className="text-gray-700">{profile.portfolio}</div>
                  </div>
                )}
              </>
            )}

            {session.user.role !== 'admin' && (
              <button onClick={() => setEditing(true)} className="btn-secondary mt-4">Редагувати профіль</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
