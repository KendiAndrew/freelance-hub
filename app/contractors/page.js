'use client'

import { useState, useEffect } from 'react'

export default function ContractorsPage() {
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadContractors()
  }, [filter])

  async function loadContractors() {
    setLoading(true)
    let url = '/api/contractors'
    if (filter) url += `?specialization=${filter}`

    const res = await fetch(url)
    const data = await res.json()
    setContractors(data)
    setLoading(false)
  }

  function getSpecLabel(spec) {
    const labels = { 'Web Development': 'Веб-розробка', 'Design': 'Дизайн', 'Writing': 'Копірайтинг', 'Marketing': 'Маркетинг' }
    return labels[spec] || spec || 'Не вказано'
  }

  function getRatingStars(rating) {
    const stars = Math.min(5, Math.max(0, Math.round((rating || 0) / 20)))
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Фрілансери</h1>
        <p className="text-gray-500 mt-1">Знайдіть кращого виконавця для вашого проекту</p>
      </div>

      {/* фільтри */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl font-medium transition ${!filter ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
          Всі
        </button>
        {['Web Development', 'Design', 'Writing', 'Marketing'].map(spec => (
          <button key={spec} onClick={() => setFilter(spec)} className={`px-4 py-2 rounded-xl font-medium transition ${filter === spec ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}>
            {getSpecLabel(spec)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : contractors.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 text-6xl mb-4">&#128100;</div>
          <div className="text-gray-500 text-lg">Фрілансерів не знайдено</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {contractors.map(c => (
            <a key={c.contractor_id} href={`/contractors/${c.contractor_id}`} className="card text-center hover:scale-[1.02] transition-transform">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {c.first_name?.[0]}{c.last_name?.[0]}
              </div>
              <h3 className="font-bold text-lg text-gray-800">{c.first_name} {c.last_name}</h3>
              <p className="text-gray-500 text-sm mb-2">{c.city || 'Місто не вказано'}</p>
              <span className="badge badge-purple mb-3">{getSpecLabel(c.specialization)}</span>
              <div className="text-amber-400 text-lg mt-2">{getRatingStars(c.rating)}</div>
              <div className="text-gray-400 text-xs mt-1">Рейтинг: {((c.rating || 0) / 10).toFixed(1)}/10</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
