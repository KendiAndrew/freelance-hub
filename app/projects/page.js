'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadProjects()
  }, [filter])

  async function loadProjects() {
    setLoading(true)
    let url = '/api/projects'
    if (filter) url += `?specialization=${filter}`

    const res = await fetch(url)
    const data = await res.json()
    setProjects(data)
    setLoading(false)
  }

  function getSpecLabel(spec) {
    const labels = { 'Web Development': 'Веб-розробка', 'Design': 'Дизайн', 'Writing': 'Копірайтинг', 'Marketing': 'Маркетинг' }
    return labels[spec] || spec
  }

  function getSpecColor(spec) {
    const colors = { 'Web Development': 'badge-blue', 'Design': 'badge-purple', 'Writing': 'badge-yellow', 'Marketing': 'badge-green' }
    return colors[spec] || 'badge-gray'
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Проекти</h1>
          <p className="text-gray-500 mt-1">Знайдіть проект для роботи або створіть свій</p>
        </div>
        {session?.user.role === 'client' && (
          <a href="/projects/new" className="btn-primary">
            + Створити проект
          </a>
        )}
      </div>

      {/* фільтри */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-xl font-medium transition ${!filter ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
        >
          Всі
        </button>
        {['Web Development', 'Design', 'Writing', 'Marketing'].map(spec => (
          <button
            key={spec}
            onClick={() => setFilter(spec)}
            className={`px-4 py-2 rounded-xl font-medium transition ${filter === spec ? 'hero-gradient text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
          >
            {getSpecLabel(spec)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Завантаження...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-300 text-6xl mb-4">&#128196;</div>
          <div className="text-gray-500 text-lg">Проектів поки немає</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {projects.map(project => (
            <a key={project.project_id} href={`/projects/${project.project_id}`} className="card hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-3">
                <span className={`badge ${getSpecColor(project.specialization)}`}>
                  {getSpecLabel(project.specialization)}
                </span>
                <span className="text-xl font-bold text-indigo-600">{Number(project.budget).toLocaleString()} грн</span>
              </div>
              <p className="text-gray-700 mb-3 line-clamp-2">{project.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Замовник: {project.client_name}</span>
                <span>до {new Date(project.deadline).toLocaleDateString('uk-UA')}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
