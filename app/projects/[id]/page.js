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

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data)
        setForm({ description: data.description, budget: data.budget, deadline: data.deadline?.split('T')[0] })
        setLoading(false)
      })
  }, [id])

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

  function getSpecLabel(spec) {
    const labels = { 'Web Development': 'Веб-розробка', 'Design': 'Дизайн', 'Writing': 'Копірайтинг', 'Marketing': 'Маркетинг' }
    return labels[spec] || spec
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>
  if (!project || project.error) return <div className="text-center py-20 text-red-500">Проект не знайдено</div>

  return (
    <div className="max-w-3xl mx-auto">
      <a href="/projects" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Назад до проектів</a>

      <div className="card">
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

            {session?.user.role === 'client' && session.user.profileId === project.client_id && (
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setEditing(true)} className="btn-secondary">Редагувати</button>
                <button onClick={handleDelete} className="btn-danger">Видалити</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
