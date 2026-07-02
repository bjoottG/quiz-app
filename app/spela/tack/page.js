import Link from 'next/link'

export default function TackPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tack!</h1>
        <p className="text-gray-500 text-sm">
          Dina svar har skickats in. Spelledaren sammanställer nu underlaget.
        </p>
        <p className="text-gray-400 text-xs mt-6">
          Du kan stänga den här sidan.
        </p>
        <Link href="/" className="mt-6 block text-violet-600 text-sm hover:underline">
          Tillbaka till start
        </Link>
      </div>
    </main>
  )
}
