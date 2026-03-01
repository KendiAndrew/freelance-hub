'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ComplaintsPage() {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ receiverId: '', subject: '', details: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session) {
      fetch('/api/complaints')
        .then(res => res.json())
        .then(data => { setComplaints(Array.isArray(data) ? data : []); setLoading(false) })
    }
  }, [session])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMessage('Скаргу подано!')
      setShowForm(false)
      setForm({ receiverId: '', subject: '', details: '' })
      // перезавантажуємо
      const data = await fetch('/api/complaints').then(r => r.json())
      setComplaints(Array.isArray(data) ? data : [])
    } else {
      setMessage('Помилка подання скарги')
    }
  }

  async function updateComplaintStatus(complaintId, status, type) {
    const res = await fetch(`/api/complaints/${complaintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, type })
    })
    if (res.ok) {
      setComplaints(complaints.map(c =>
        c.complaint_id === complaintId ? { ...c, status } : c
      ))
    }
  }

  function getStatusBadge(status) {
    const map = { 'In Process': 'badge-yellow', 'Resolved': 'badge-green', 'Rejected': 'badge-red' }
    return map[status] || 'badge-gray'
  }

  function getStatusLabel(status) {
    const map = { 'In Process': 'В обробці', 'Resolved': 'Вирішено', 'Rejected': 'Відхилено' }
    return map[status] || status
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Увійдіть для перегляду скарг</div>
        <a href="/login" className="btn-primary mt-4 inline-block">Увійти</a>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Скарги</h1>
          <p className="text-gray-500 mt-1">
            {session.user.role === 'admin' ? 'Управління скаргами користувачів' : 'Ваші подані скарги'}
          </p>
        </div>
        {session.user.role !== 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            + Подати скаргу
          </button>
        )}
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Нова скарга</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="label">ID отримувача</label>
              <input type="number" className="input" value={form.receiverId} onChange={e => setForm({ ...form, receiverId: e.target.value })} placeholder="ID виконавця або замовника" required />
            </div>
            <div className="mb-4">
              <label className="label">Тема</label>
              <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Коротко опишіть проблему" required />
            </div>
            <div className="mb-4">
              <label className="label">Деталі</label>
              <textarea className="input" rows={3} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Детальний опис скарги..." required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Надіслати скаргу</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Скасувати</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 text-6xl mb-4">&#9989;</div>
          <div className="text-gray-500 text-lg">Скарг немає</div>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div key={`${c.type || 'c'}-${c.complaint_id}`} className="card">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-bold text-gray-800">#{c.complaint_id}</span>
                    <span className={`badge ${getStatusBadge(c.status)}`}>{getStatusLabel(c.status)}</span>
                    {c.type && <span className="badge badge-gray">{c.type === 'client' ? 'Від клієнта' : 'Від виконавця'}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">{c.subject}</h3>
                  <p className="text-gray-600 text-sm mb-2">{c.details}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {c.sender_name && <span>Від: {c.sender_name}</span>}
                    <span>На: {c.receiver_name}</span>
                    <span>{new Date(c.created_at).toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>
                {session.user.role === 'admin' && c.status === 'In Process' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => updateComplaintStatus(c.complaint_id, 'Resolved', c.type)} className="btn-primary text-sm py-1 px-3">Вирішено</button>
                    <button onClick={() => updateComplaintStatus(c.complaint_id, 'Rejected', c.type)} className="btn-danger text-sm py-1 px-3">Відхилити</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
