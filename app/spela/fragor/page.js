'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FragorPage() {
  const router = useRouter()
  const [fragor, setFragor] = useState(null)
  const [index, setIndex] = useState(0)
  const [svar, setSvar] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/spela/fragor')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setFragor)
      .catch(() => router.push('/spela'))
  }, [router])

  if (!fragor) return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center">
      <p className="text-white text-sm">Laddar frågor…</p>
    </main>
  )

  if (fragor.length === 0) return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center">
      <p className="text-white text-sm">Inga frågor hittades.</p>
    </main>
  )

  const fraga = fragor[index]
  const isLast = index === fragor.length - 1
  const currentValue = svar[fraga.id] ?? ''
  const canNext = currentValue !== ''

  function handleChange(e) {
    setSvar(s => ({ ...s, [fraga.id]: e.target.value }))
  }

  async function handleNext(e) {
    e.preventDefault()
    if (!canNext || submitting) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/spela/svar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        svar: [{ fraga_id: fraga.id, svar_text: currentValue }],
        finalize: isLast,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Något gick fel. Försök igen.')
      setSubmitting(false)
      return
    }

    if (isLast) {
      router.push('/spela/tack')
    } else {
      setIndex(i => i + 1)
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {fragor.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? 'bg-violet-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        <p className="text-xs font-medium text-violet-500 mb-2 uppercase tracking-wide">
          Fråga {index + 1} av {fragor.length}
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{fraga.fraga}</h2>
        {fraga.beskrivning && <p className="text-sm text-gray-400 mb-6">{fraga.beskrivning}</p>}
        {!fraga.beskrivning && <div className="mb-6" />}

        <form onSubmit={handleNext} className="space-y-4">
          {fraga.typ === 'number' ? (
            <input
              key={fraga.id}
              type="number"
              value={currentValue}
              onChange={handleChange}
              min={fraga.min_varde ?? undefined}
              max={fraga.max_varde ?? undefined}
              inputMode="numeric"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
              autoFocus
            />
          ) : (
            <input
              key={fraga.id}
              type="text"
              value={currentValue}
              onChange={handleChange}
              maxLength={fraga.max_langd ?? 200}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
              autoFocus
            />
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => setIndex(i => i - 1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                ← Tillbaka
              </button>
            )}
            <button type="submit" disabled={!canNext || submitting}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Sparar…' : isLast ? 'Skicka in' : 'Nästa →'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-300 text-center mt-6">
          Svara ärligt — visa inte dina svar för andra spelare
        </p>
      </div>
    </main>
  )
}
