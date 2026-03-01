'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function AdminPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (session?.user.role === 'admin') {
      Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json())
      ]).then(([statsData, usersData]) => {
        setStats(statsData)
        setUsers(Array.isArray(usersData) ? usersData : [])
        setLoading(false)
      })
    }
  }, [session])

  async function deleteUser(userId) {
    if (!confirm('Видалити цього користувача?')) return
    const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(users.filter(u => u.user_id !== userId))
    }
  }

  function getRoleLabel(role) {
    const map = { 'client': 'Замовник', 'contractor': 'Виконавець', 'admin': 'Адмін' }
    return map[role] || role
  }

  function getRoleBadge(role) {
    const map = { 'client': 'badge-blue', 'contractor': 'badge-purple', 'admin': 'badge-red' }
    return map[role] || 'badge-gray'
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <div className="text-gray-300 text-6xl mb-4">&#128274;</div>
        <div className="text-gray-500 text-lg">Тільки для адміністраторів</div>
        <a href="/" className="btn-primary mt-4 inline-block">На головну</a>
      </div>
    )
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Завантаження...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Адмін-панель</h1>
        <p className="text-gray-500 mt-1">Управління системою та статистика</p>
      </div>

      {/* табки */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setTab('stats')} className={`px-5 py-2.5 rounded-xl font-medium transition ${tab === 'stats' ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
          Статистика
        </button>
        <button onClick={() => setTab('users')} className={`px-5 py-2.5 rounded-xl font-medium transition ${tab === 'users' ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
          Користувачі ({users.length})
        </button>
        <button onClick={() => setTab('top')} className={`px-5 py-2.5 rounded-xl font-medium transition ${tab === 'top' ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
          Топ виконавців
        </button>
      </div>

      {/* статистика */}
      {tab === 'stats' && (
        <div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center border-t-4 border-indigo-500">
              <div className="text-3xl font-bold text-indigo-600">{users.length}</div>
              <div className="text-gray-500 text-sm">Користувачів</div>
            </div>
            <div className="card text-center border-t-4 border-purple-500">
              <div className="text-3xl font-bold text-purple-600">{stats?.totalDeals || 0}</div>
              <div className="text-gray-500 text-sm">Угод</div>
            </div>
            {stats?.usersByRole?.map(r => (
              <div key={r.role} className="card text-center border-t-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{r.count}</div>
                <div className="text-gray-500 text-sm">{getRoleLabel(r.role)}</div>
              </div>
            ))}
          </div>

          {/* статистика проектів */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">Статистика проектів (VIEW)</h2>
          {stats?.projectStats?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {Object.keys(stats.projectStats[0]).map(key => (
                      <th key={key} className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.projectStats.map((row, i) => (
                    <tr key={i} className="table-row border-b border-gray-100">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="py-3 px-4 text-gray-700 text-sm">{val?.toString() || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card text-center text-gray-400">Даних немає</div>
          )}
        </div>
      )}

      {/* користувачі */}
      {tab === 'users' && (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.user_id} className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{user.first_name} {user.last_name}</div>
                  <div className="text-gray-500 text-sm">{user.login} &middot; {user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${getRoleBadge(user.role)}`}>{getRoleLabel(user.role)}</span>
                <span className="text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString('uk-UA')}</span>
                {user.role !== 'admin' && (
                  <button onClick={() => deleteUser(user.user_id)} className="btn-danger text-xs py-1 px-3">Видалити</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* топ виконавців */}
      {tab === 'top' && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Топ виконавців (VIEW)</h2>
          {stats?.topContractors?.length > 0 ? (
            <div className="space-y-3">
              {stats.topContractors.map((c, i) => (
                <div key={i} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{c.first_name} {c.last_name}</div>
                    <div className="text-gray-500 text-sm">{c.specialization || 'Не вказано'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 font-bold">{'★'.repeat(Math.min(5, Math.max(0, Math.round((c.rating || 0) / 20))))}{'☆'.repeat(5 - Math.min(5, Math.max(0, Math.round((c.rating || 0) / 20))))}</div>
                    <div className="text-gray-400 text-xs">Рейтинг: {((c.rating || 0) / 10).toFixed(1)}/10</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center text-gray-400">Даних немає</div>
          )}
        </div>
      )}
    </div>
  )
}
