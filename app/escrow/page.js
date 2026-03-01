'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function EscrowPage() {
  const { data: session } = useSession()
  const [escrows, setEscrows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetch('/api/escrow')
        .then(res => res.json())
        .then(data => { setEscrows(Array.isArray(data) ? data : []); setLoading(false) })
    }
  }, [session])

  function getStatusBadge(status) {
    const map = { 'Frozen': 'badge-blue', 'Released': 'badge-green', 'Returned': 'badge-yellow' }
    return map[status] || 'badge-gray'
  }

  function getStatusLabel(status) {
    const map = { 'Frozen': 'Заморожено', 'Released': 'Виплачено', 'Returned': 'Повернуто' }
    return map[status] || status
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Увійдіть для перегляду ескроу</div>
        <a href="/login" className="btn-primary mt-4 inline-block">Увійти</a>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ескроу-рахунки</h1>
        <p className="text-gray-500 mt-1">Безпечне зберігання коштів до завершення роботи</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : escrows.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 text-6xl mb-4">&#128176;</div>
          <div className="text-gray-500 text-lg">Ескроу-рахунків немає</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Угода</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Сума</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Статус</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Заморожено</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Виплачено</th>
                {session.user.role === 'admin' && <th className="text-left py-3 px-4 font-semibold text-gray-600">Учасники</th>}
              </tr>
            </thead>
            <tbody>
              {escrows.map(e => (
                <tr key={e.safe_id} className="table-row border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-700">#{e.safe_id}</td>
                  <td className="py-3 px-4">
                    <span className="text-indigo-600 font-medium">Угода #{e.deal_id}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-800">{Number(e.amount).toLocaleString()} грн</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getStatusBadge(e.status)}`}>{getStatusLabel(e.status)}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {e.freeze_date ? new Date(e.freeze_date).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {e.release_date ? new Date(e.release_date).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  {session.user.role === 'admin' && (
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {e.client_name && <div>Замовник: {e.client_name}</div>}
                      {e.contractor_name && <div>Виконавець: {e.contractor_name}</div>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* підсумок */}
      {escrows.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="card text-center border-t-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">
              {escrows.filter(e => e.status === 'Frozen').reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} грн
            </div>
            <div className="text-gray-500 text-sm">Заморожено</div>
          </div>
          <div className="card text-center border-t-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">
              {escrows.filter(e => e.status === 'Released').reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} грн
            </div>
            <div className="text-gray-500 text-sm">Виплачено</div>
          </div>
          <div className="card text-center border-t-4 border-amber-500">
            <div className="text-2xl font-bold text-amber-600">
              {escrows.filter(e => e.status === 'Returned').reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} грн
            </div>
            <div className="text-gray-500 text-sm">Повернуто</div>
          </div>
        </div>
      )}
    </div>
  )
}
