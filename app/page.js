import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-1">Frågor om dig</h1>
        <p className="text-gray-400 mb-8 text-sm">Välj din roll för att fortsätta</p>
        <div className="space-y-3">
          <Link
            href="/spela"
            className="block w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
          >
            Spelare
          </Link>
          <Link
            href="/spelledare"
            className="block w-full py-3 px-6 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl transition-colors"
          >
            Spelledare
          </Link>
          <Link
            href="/admin"
            className="block w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
