export default function Home() {
  return (
    <div>
      {/* hero */}
      <div className="hero-gradient text-white rounded-2xl p-10 md:p-16 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Знайдіть ідеального<br />фрілансера
          </h1>
          <p className="text-lg text-indigo-100 mb-8 max-w-xl">
            FreelanceHub — платформа для пошуку виконавців та замовлення проектів.
            Безпечні угоди, рейтинги, ескроу-захист коштів.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/projects" className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg">
              Переглянути проекти
            </a>
            <a href="/register" className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition">
              Зареєструватися
            </a>
          </div>
        </div>
      </div>

      {/* як це працює */}
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Як це працює?</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-14">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Створіть проект</h3>
          <p className="text-gray-500">Опишіть задачу, вкажіть бюджет та дедлайн для виконання</p>
        </div>
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Знайдіть виконавця</h3>
          <p className="text-gray-500">Перегляньте рейтинги фрілансерів, відгуки та портфоліо</p>
        </div>
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Безпечна угода</h3>
          <p className="text-gray-500">Ескроу захищає ваші кошти до завершення роботи</p>
        </div>
      </div>

      {/* спеціалізації */}
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Спеціалізації</h2>
      <div className="grid md:grid-cols-4 gap-5 mb-14">
        {[
          { name: 'Web Development', label: 'Веб-розробка', color: 'bg-blue-100 text-blue-700', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
          { name: 'Design', label: 'Дизайн', color: 'bg-pink-100 text-pink-700', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { name: 'Writing', label: 'Копірайтинг', color: 'bg-amber-100 text-amber-700', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
          { name: 'Marketing', label: 'Маркетинг', color: 'bg-green-100 text-green-700', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' }
        ].map((spec) => (
          <a
            key={spec.name}
            href={`/projects?specialization=${spec.name}`}
            className="card text-center hover:scale-105 transition-transform"
          >
            <div className={`w-14 h-14 mx-auto mb-3 rounded-xl ${spec.color} flex items-center justify-center`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={spec.icon} />
              </svg>
            </div>
            <div className="font-semibold text-gray-700">{spec.label}</div>
          </a>
        ))}
      </div>

      {/* інфо блоки */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center border-t-4 border-indigo-500">
          <div className="text-3xl font-bold text-indigo-600 mb-1">4</div>
          <div className="text-gray-500">Спеціалізації</div>
        </div>
        <div className="card text-center border-t-4 border-purple-500">
          <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
          <div className="text-gray-500">Безпечні платежі</div>
        </div>
        <div className="card text-center border-t-4 border-green-500">
          <div className="text-3xl font-bold text-green-600 mb-1">24/7</div>
          <div className="text-gray-500">Підтримка</div>
        </div>
      </div>
    </div>
  )
}
