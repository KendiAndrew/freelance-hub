'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="hero-gradient shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="text-2xl font-bold text-white tracking-tight">
            FreelanceHub
          </a>

          {/* десктоп меню */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="/projects" className="text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
              Проекти
            </a>
            <a href="/contractors" className="text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
              Фрілансери
            </a>

            {session ? (
              <>
                <a href="/deals" className="text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
                  Угоди
                </a>
                <a href="/complaints" className="text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
                  Скарги
                </a>
                <a href="/escrow" className="text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
                  Ескроу
                </a>
                {session.user.role === 'admin' && (
                  <a href="/admin" className="text-yellow-300 hover:text-yellow-100 hover:bg-white/10 px-3 py-2 rounded-lg transition font-semibold">
                    Адмін
                  </a>
                )}

                <div className="ml-2 pl-2 border-l border-white/20 flex items-center space-x-2">
                  <a href="/profile" className="bg-white/15 text-white px-3 py-1.5 rounded-lg hover:bg-white/25 transition text-sm font-medium">
                    {session.user.firstName || session.user.login}
                  </a>
                  <button
                    onClick={() => signOut()}
                    className="bg-white/10 text-indigo-100 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition text-sm"
                  >
                    Вийти
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-2 pl-2 border-l border-white/20 flex items-center space-x-2">
                <a href="/login" className="text-indigo-100 hover:text-white px-3 py-2 rounded-lg transition">
                  Увійти
                </a>
                <a href="/register" className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition">
                  Реєстрація
                </a>
              </div>
            )}
          </div>

          {/* мобільна кнопка */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* мобільне меню */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <a href="/projects" className="block text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg">Проекти</a>
            <a href="/contractors" className="block text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg">Фрілансери</a>
            {session ? (
              <>
                <a href="/deals" className="block text-indigo-100 hover:bg-white/10 px-3 py-2 rounded-lg">Угоди</a>
                <a href="/complaints" className="block text-indigo-100 hover:bg-white/10 px-3 py-2 rounded-lg">Скарги</a>
                <a href="/escrow" className="block text-indigo-100 hover:bg-white/10 px-3 py-2 rounded-lg">Ескроу</a>
                <a href="/profile" className="block text-indigo-100 hover:bg-white/10 px-3 py-2 rounded-lg">Профіль</a>
                {session.user.role === 'admin' && (
                  <a href="/admin" className="block text-yellow-300 hover:bg-white/10 px-3 py-2 rounded-lg font-semibold">Адмін</a>
                )}
                <button onClick={() => signOut()} className="text-red-300 hover:text-red-100 px-3 py-2">Вийти</button>
              </>
            ) : (
              <>
                <a href="/login" className="block text-indigo-100 px-3 py-2">Увійти</a>
                <a href="/register" className="block text-white font-semibold px-3 py-2">Реєстрація</a>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
