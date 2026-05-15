'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ description: '', budget: '', deadline: '' })

  // заявки (Pending deals для цього проекту)
  const [applications, setApplications] = useState([])
  const [myApplication, setMyApplication] = useState(null)
  const [showAppForm, setShowAppForm] = useState(false)
  const [appComment, setAppComment] = useState('')
  const [appMessage, setAppMessage] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data)
        setForm({ description: data.description, budget: data.budget, deadline: data.deadline?.split('T')[0] })
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!session || !id) return
    if (session.user.role === 'client') {
      fetch(`/api/deals?projectId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setApplications(data.filter(d => d.status === 'Pending'))
          }
        })
    }
    if (session.user.role === 'contractor') {
      fetch('/api/deals')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mine = data.find(d => String(d.project_id) === String(id) && d.status === 'Pending')
            setMyApplication(mine || null)
          }
        })
    }
  }, [session, id])

  async function handleUpdate(e) {
    e.preventDefault()
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const updated = await res.json()
      setProject({ ...project, ...updated })
      setEditing(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Видалити цей проект?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/projects')
  }

  async function handleApply(e) {
    e.preventDefault()
    setAppMessage('')
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, comment: appComment })
    })
    const data = await res.json()
    if (res.ok) {
      setMyApplication(data)
      setShowAppForm(false)
      setAppMessage('Заявку подано!')
    } else {
      setAppMessage(data.error || 'Помилка')
    }
  }

  async function handleApplicationAction(dealId, status) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      if (status === 'In Progress') {
        router.push('/deals')
      } else {
        setApplications(prev => prev.filter(a => a.deal_id !== dealId))
      }
    }
  }

  function getSpecLabel(spec) {
    const labels = { 'Web Development': 'Веб-розробка', 'Design': 'Дизайн', 'Writing': 'Копірайтинг', 'Marketing': 'Маркетинг' }
    return labels[spec] || spec
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>
  if (!project || project.error) return <div className="text-center py-20 text-red-500">Проект не знайдено</div>

  const isOwner = session?.user.role === 'client' && Number(session.user.profileId) === Number(project.client_id)

  return (
    <div className="max-w-3xl mx-auto">
      <a href="/projects" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Назад до проектів</a>

      <div className="card mb-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
          <span className="badge badge-blue">{getSpecLabel(project.specialization)}</span>
          <span className="text-2xl font-bold text-indigo-600">{Number(project.budget).toLocaleString()} грн</span>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate}>
            <div className="mb-4">
              <label className="label">Опис</label>
              <textarea className="input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Бюджет (грн)</label>
                <input type="number" className="input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div>
                <label className="label">Дедлайн</label>
                <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Зберегти</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Замовник</div>
                <div className="font-semibold text-gray-700">{project.client_name}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Місто</div>
                <div className="font-semibold text-gray-700">{project.client_city || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Дедлайн</div>
                <div className="font-semibold text-gray-700">{new Date(project.deadline).toLocaleDateString('uk-UA')}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Створено</div>
                <div className="font-semibold text-gray-700">{new Date(project.created_at).toLocaleDateString('uk-UA')}</div>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setEditing(true)} className="btn-secondary">Редагувати</button>
                <button onClick={handleDelete} className="btn-danger">Видалити</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Виконавець — подача заявки */}
      {session?.user.role === 'contractor' && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Подати заявку</h2>
          {appMessage && (
            <div className={`px-4 py-3 rounded-xl mb-3 text-sm ${myApplication ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {appMessage}
            </div>
          )}
          {myApplication ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Статус заявки:</span>
              <span className="badge badge-yellow">Очікує розгляду</span>
            </div>
          ) : showAppForm ? (
            <form onSubmit={handleApply}>
              <div className="mb-3">
                <label className="label">Коментар (необов&apos;язково)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Розкажіть про свій досвід або підхід до проекту..."
                  value={appComment}
                  onChange={e => setAppComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Надіслати заявку</button>
                <button type="button" onClick={() => setShowAppForm(false)} className="btn-secondary">Скасувати</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAppForm(true)} className="btn-primary">Подати заявку</button>
          )}
        </div>
      )}

      {/* Клієнт — список заявок */}
      {isOwner && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Заявки ({applications.length})</h2>
          {applications.length === 0 ? (
            <div className="card text-center text-gray-400">Заявок поки немає</div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.deal_id} className="card">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{app.contractor_name}</span>
                        {app.contractor_specialization && <span className="badge badge-purple">{getSpecLabel(app.contractor_specialization)}</span>}
                      </div>
                      {app.task_data?.comment && (
                        <p className="text-gray-600 text-sm mb-2">{app.task_data.comment}</p>
                      )}
                      <div className="text-gray-400 text-xs">
                        {new Date(app.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <button
                        onClick={() => handleApplicationAction(app.deal_id, 'In Progress')}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        Прийняти
                      </button>
                      <button
                        onClick={() => handleApplicationAction(app.deal_id, 'Cancelled')}
                        className="btn-danger text-sm py-1 px-3"
                      >
                        Відхилити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
