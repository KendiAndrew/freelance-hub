export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-400">Завантаження...</div>
      </div>
    </div>
  )
}
