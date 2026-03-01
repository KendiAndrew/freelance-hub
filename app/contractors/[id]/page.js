'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'

export default function ContractorDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [contractor, setContractor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDealForm, setShowDealForm] = useState(false)
  const [dealForm, setDealForm] = useState({ projectId: '', amount: '' })
  const [projects, setProjects] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/contractors/${id}`)
      .then(res => res.json())
      .then(data => { setContractor(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (session?.user.role === 'client') {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setProjects(data.filter(p => p.client_id === session.user.profileId)))
    }
  }, [session])

  async function handleCreateDeal(e) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: dealForm.projectId, contractorId: id, amount: dealForm.amount })
    })
    if (res.ok) {
      setMessage('Угоду створено!')
      setShowDealForm(false)
    } else {
      const data = await res.json()
      setMessage(data.error || 'Помилка')
    }
  }

  function getRatingStars(rating) {
    const stars = Math.min(5, Math.max(0, Math.round((rating || 0) / 20)))
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>
  if (!contractor || contractor.error) return <div className="text-center py-20 text-red-500">Фрілансера не знайдено</div>

  return (
    <div className="max-w-3xl mx-auto">
      <a href="/contractors" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Назад до фрілансерів</a>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {contractor.first_name?.[0]}{contractor.last_name?.[0]}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{contractor.first_name} {contractor.last_name}</h1>
            <p className="text-gray-500">{contractor.city || 'Місто не вказано'}</p>
            <div className="text-amber-400 text-xl mt-2">{getRatingStars(contractor.rating)}</div>
            <span className="badge badge-purple mt-2">{contractor.specialization || 'Не вказано'}</span>
          </div>
        </div>

        {contractor.resume && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-700 mb-2">Резюме</h3>
            <p className="text-gray-600">{contractor.resume}</p>
          </div>
        )}

        {contractor.portfolio && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Портфоліо</h3>
            <p className="text-gray-600">{contractor.portfolio}</p>
          </div>
        )}

        {session?.user.role === 'client' && (
          <div className="mt-6 pt-6 border-t">
            {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{message}</div>}
            {showDealForm ? (
              <form onSubmit={handleCreateDeal}>
                <h3 className="font-semibold text-gray-700 mb-3">Створити угоду</h3>
                <div className="mb-3">
                  <label className="label">Проект</label>
                  <select className="input" value={dealForm.projectId} onChange={e => setDealForm({ ...dealForm, projectId: e.target.value })} required>
                    <option value="">Оберіть проект</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.description?.substring(0, 60)}...</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="label">Сума (грн)</label>
                  <input type="number" className="input" min="1" value={dealForm.amount} onChange={e => setDealForm({ ...dealForm, amount: e.target.value })} required />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">Створити угоду</button>
                  <button type="button" onClick={() => setShowDealForm(false)} className="btn-secondary">Скасувати</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowDealForm(true)} className="btn-primary">Запропонувати угоду</button>
            )}
          </div>
        )}
      </div>

      {/* відгуки */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Відгуки ({contractor.ratings?.length || 0})</h2>
      {contractor.ratings?.length > 0 ? (
        <div className="space-y-4">
          {contractor.ratings.map(r => (
            <div key={r.ratings_id} className="card">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-700">{r.reviewer_name}</span>
                <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(10 - r.rating)}</span>
              </div>
              <p className="text-gray-600">{r.review_text}</p>
              <div className="text-gray-400 text-xs mt-2">{new Date(r.created_at).toLocaleDateString('uk-UA')}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-gray-400">Відгуків поки немає</div>
      )}
    </div>
  )
}
