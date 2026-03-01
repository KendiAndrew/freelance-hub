'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function DealsPage() {
  const { data: session } = useSession()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetch('/api/deals')
        .then(res => res.json())
        .then(data => { setDeals(Array.isArray(data) ? data : []); setLoading(false) })
    }
  }, [session])

  async function updateStatus(dealId, status) {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      setDeals(deals.map(d => d.deal_id === dealId ? { ...d, status } : d))
    }
  }

  function getStatusBadge(status) {
    const map = {
      'Pending': 'badge-yellow',
      'In Progress': 'badge-blue',
      'Completed': 'badge-green',
      'Cancelled': 'badge-red'
    }
    return map[status] || 'badge-gray'
  }

  function getStatusLabel(status) {
    const map = { 'Pending': 'Очікує', 'In Progress': 'В роботі', 'Completed': 'Завершено', 'Cancelled': 'Скасовано' }
    return map[status] || status
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Увійдіть для перегляду угод</div>
        <a href="/login" className="btn-primary mt-4 inline-block">Увійти</a>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Мої угоди</h1>
        <p className="text-gray-500 mt-1">Управління вашими угодами та їх статусами</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 text-6xl mb-4">&#128196;</div>
          <div className="text-gray-500 text-lg">Угод поки немає</div>
          <a href="/contractors" className="btn-primary mt-4 inline-block">Знайти виконавця</a>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map(deal => (
            <div key={deal.deal_id} className="card">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-bold text-gray-800">Угода #{deal.deal_id}</span>
                    <span className={`badge ${getStatusBadge(deal.status)}`}>{getStatusLabel(deal.status)}</span>
                    {deal.specialization && <span className="badge badge-purple">{deal.specialization}</span>}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{deal.project_desc || 'Без опису проекту'}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {deal.client_name && <span>Замовник: {deal.client_name}</span>}
                    {deal.contractor_name && <span>Виконавець: {deal.contractor_name}</span>}
                    <span>Створено: {new Date(deal.created_at).toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <div className="text-2xl font-bold text-indigo-600 mb-2">{Number(deal.amount).toLocaleString()} грн</div>
                  {deal.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(deal.deal_id, 'In Progress')} className="btn-primary text-sm py-1 px-3">Прийняти</button>
                      <button onClick={() => updateStatus(deal.deal_id, 'Cancelled')} className="btn-danger text-sm py-1 px-3">Скасувати</button>
                    </div>
                  )}
                  {deal.status === 'In Progress' && (
                    <button onClick={() => updateStatus(deal.deal_id, 'Completed')} className="btn-primary text-sm py-1 px-3">Завершити</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
