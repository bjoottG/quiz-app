'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SpelaPage() {
  const [form, setForm] = useState({ namn: '', kod: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/spela/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namn: form.namn.trim(), kod: form.kod.trim() }),
    })
    if (res.ok) {
      router.push('/spela/fragor')
    } else {
      const data = await res.json()
      setError(data.error || 'Något gick fel')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <Link href="/" className="text-violet-600 text-sm mb-6 block hover:underline">← Tillbaka</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Anslut till quiz</h1>
        <p className="text-gray-400 text-sm mb-6">Ange ditt namn och koden du fått av spelledaren</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ditt namn</label>
            <input
              type="text"
              value={form.namn}
              onChange={e => setForm(f => ({ ...f, namn: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ange ditt namn"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spelkod</label>
            <input
              type="text"
              value={form.kod}
              onChange={e => setForm(f => ({ ...f, kod: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="1234"
              maxLength={4}
              pattern="\d{4}"
              inputMode="numeric"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || form.kod.length !== 4 || !form.namn.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Ansluter…' : 'Anslut'}
          </button>
        </form>
      </div>
    </main>
  )
}
