'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function FragaForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(initial || { fraga: '', beskrivning: '', typ: 'text', min_varde: '', max_varde: '', max_langd: '200' })
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fråga</label>
        <textarea value={form.fraga} onChange={e => setForm(f => ({ ...f, fraga: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" rows={2} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning <span className="text-gray-400 font-normal">(valfri)</span></label>
        <input type="text" value={form.beskrivning} onChange={e => setForm(f => ({ ...f, beskrivning: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" placeholder="t.ex. Svara med ÅÅÅÅ" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Svarstyp</label>
        <select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
          <option value="text">Fritext</option>
          <option value="number">Siffror</option>
        </select>
      </div>
      {form.typ === 'number' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
            <input type="number" value={form.min_varde} onChange={e => setForm(f => ({ ...f, min_varde: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" placeholder="t.ex. 1900" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
            <input type="number" value={form.max_varde} onChange={e => setForm(f => ({ ...f, max_varde: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" placeholder="t.ex. 2025" />
          </div>
        </div>
      )}
      {form.typ === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max antal tecken</label>
          <input type="number" value={form.max_langd} onChange={e => setForm(f => ({ ...f, max_langd: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" min={1} max={1000} />
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Avbryt</button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? 'Sparar…' : 'Spara'}
        </button>
      </div>
    </form>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('spelledare')
  const [spelledare, setSpelledare] = useState([])
  const [fragor, setFragor] = useState([])
  const [spelomgangar, setSpelomgangar] = useState([])
  const [loadingSpelledare, setLoadingSpelledare] = useState(true)
  const [loadingFragor, setLoadingFragor] = useState(true)
  const [loadingSpelomgangar, setLoadingSpelomgangar] = useState(true)

  const [showSpelledareForm, setShowSpelledareForm] = useState(false)
  const [editSpelledare, setEditSpelledare] = useState(null)
  const [spelledareForm, setSpelledareForm] = useState({ username: '', password: '' })
  const [spelledareError, setSpelledareError] = useState('')
  const [spelledareSaving, setSpelledareSaving] = useState(false)

  const [showFragaForm, setShowFragaForm] = useState(false)
  const [editFraga, setEditFraga] = useState(null)
  const [fragaError, setFragaError] = useState('')
  const [fragaSaving, setFragaSaving] = useState(false)

  async function loadSpelledare() {
    const res = await fetch('/api/admin/spelledare')
    if (res.status === 401) { router.push('/admin'); return }
    setSpelledare(await res.json())
    setLoadingSpelledare(false)
  }

  async function loadFragor() {
    const res = await fetch('/api/admin/fragor')
    if (res.ok) setFragor(await res.json())
    setLoadingFragor(false)
  }

  async function loadSpelomgangar() {
    const res = await fetch('/api/admin/spelomgangar')
    if (res.ok) setSpelomgangar(await res.json())
    setLoadingSpelomgangar(false)
  }

  useEffect(() => { loadSpelledare(); loadFragor(); loadSpelomgangar() }, [])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  // Spelledare handlers
  async function saveSpelledare(e) {
    e.preventDefault()
    setSpelledareSaving(true)
    setSpelledareError('')
    const url = editSpelledare ? `/api/admin/spelledare/${editSpelledare.id}` : '/api/admin/spelledare'
    const method = editSpelledare ? 'PUT' : 'POST'
    const body = editSpelledare
      ? { username: spelledareForm.username, ...(spelledareForm.password ? { password: spelledareForm.password } : {}) }
      : spelledareForm
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowSpelledareForm(false); loadSpelledare() }
    else { const d = await res.json(); setSpelledareError(d.error || 'Fel') }
    setSpelledareSaving(false)
  }

  async function deleteSpelledare(id) {
    if (!confirm('Ta bort spelledaren?')) return
    await fetch(`/api/admin/spelledare/${id}`, { method: 'DELETE' })
    loadSpelledare()
  }

  // Fråga handlers
  async function saveFraga(form) {
    setFragaSaving(true)
    setFragaError('')
    const url = editFraga ? `/api/admin/fragor/${editFraga.id}` : '/api/admin/fragor'
    const method = editFraga ? 'PUT' : 'POST'
    const body = {
      fraga: form.fraga,
      beskrivning: form.beskrivning,
      typ: form.typ,
      min_varde: form.min_varde ? parseInt(form.min_varde) : null,
      max_varde: form.max_varde ? parseInt(form.max_varde) : null,
      max_langd: form.max_langd ? parseInt(form.max_langd) : 200,
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowFragaForm(false); setEditFraga(null); loadFragor() }
    else { const d = await res.json(); setFragaError(d.error || 'Fel') }
    setFragaSaving(false)
  }

  async function deleteFraga(id) {
    if (!confirm('Ta bort frågan?')) return
    const res = await fetch(`/api/admin/fragor/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error) }
    else loadFragor()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-violet-600 text-sm hover:underline">← Start</Link>
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Logga ut</button>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6 max-w-2xl mx-auto">
          {[['spelledare', 'Spelledare'], ['spelomgangar', 'Spelomgångar'], ['fragor', 'Underlagsfrågor']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Spelledare tab */}
        {tab === 'spelledare' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Spelledare</h2>
              <button onClick={() => { setEditSpelledare(null); setSpelledareForm({ username: '', password: '' }); setSpelledareError(''); setShowSpelledareForm(true) }}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">+ Lägg till</button>
            </div>
            {loadingSpelledare ? <p className="text-gray-400 text-sm">Laddar…</p> :
              spelledare.length === 0 ? <p className="text-gray-400 text-sm">Inga spelledare ännu.</p> : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {spelledare.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3">
                      <span className="font-medium text-gray-800">{s.username}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditSpelledare(s); setSpelledareForm({ username: s.username, password: '' }); setSpelledareError(''); setShowSpelledareForm(true) }} className="text-sm text-violet-600 hover:underline">Redigera</button>
                        <button onClick={() => deleteSpelledare(s.id)} className="text-sm text-red-500 hover:underline">Ta bort</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </>
        )}

        {/* Spelomgångar tab */}
        {tab === 'spelomgangar' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Alla spelomgångar</h2>
              <span className="text-sm text-gray-400">{spelomgangar.length} st</span>
            </div>
            {loadingSpelomgangar ? <p className="text-gray-400 text-sm">Laddar…</p> :
              spelomgangar.length === 0 ? <p className="text-gray-400 text-sm">Inga spelomgångar ännu.</p> : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {spelomgangar.map(s => {
                    const statusLabel = { skapad: 'Ej startad', fas1: 'Fas 1', fas2: 'Fas 2', avslutad: 'Avslutad' }
                    const statusColor = { skapad: 'bg-gray-100 text-gray-600', fas1: 'bg-green-100 text-green-700', fas2: 'bg-blue-100 text-blue-700', avslutad: 'bg-gray-100 text-gray-500' }
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800">{s.namn}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>{statusLabel[s.status]}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {s.spelledare?.username ?? '–'} &middot; kod <span className="font-mono font-semibold text-violet-600">{s.kod}</span> &middot; {s.antal_spelare} spelare
                          </p>
                        </div>
                        <Link href={`/admin/spelomgang/${s.id}`}
                          className="text-sm text-violet-600 hover:underline shrink-0">
                          Visa
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
          </>
        )}

        {/* Frågor tab */}
        {tab === 'fragor' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Underlagsfrågor</h2>
              <button onClick={() => { setEditFraga(null); setFragaError(''); setShowFragaForm(true) }}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">+ Lägg till</button>
            </div>
            {loadingFragor ? <p className="text-gray-400 text-sm">Laddar…</p> :
              fragor.length === 0 ? <p className="text-gray-400 text-sm">Inga frågor ännu.</p> : (
                <div className="space-y-2">
                  {fragor.map(f => (
                    <div key={f.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{f.fraga}</p>
                          {f.beskrivning && <p className="text-xs text-gray-400 mt-0.5">{f.beskrivning}</p>}
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{f.typ === 'number' ? 'Siffror' : 'Fritext'}</span>
                            {f.ar_ursprunglig
                              ? <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">Ursprunglig</span>
                              : <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{f.spelledare?.username ?? 'Spelledare'}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditFraga(f); setFragaError(''); setShowFragaForm(true) }} className="text-sm text-violet-600 hover:underline">Redigera</button>
                          <button onClick={() => deleteFraga(f.id)} className="text-sm text-red-500 hover:underline">Ta bort</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </>
        )}
      </div>

      {/* Spelledare modal */}
      {showSpelledareForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{editSpelledare ? 'Redigera spelledare' : 'Ny spelledare'}</h3>
            <form onSubmit={saveSpelledare} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Användarnamn</label>
                <input type="text" value={spelledareForm.username} onChange={e => setSpelledareForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lösenord {editSpelledare && <span className="text-gray-400 font-normal">(lämna tomt för att behålla)</span>}</label>
                <input type="password" value={spelledareForm.password} onChange={e => setSpelledareForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" required={!editSpelledare} />
              </div>
              {spelledareError && <p className="text-red-600 text-sm">{spelledareError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSpelledareForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Avbryt</button>
                <button type="submit" disabled={spelledareSaving} className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {spelledareSaving ? 'Sparar…' : 'Spara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fråga modal */}
      {showFragaForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editFraga ? 'Redigera fråga' : 'Ny ursprunglig fråga'}</h3>
            <FragaForm
              initial={editFraga ? { fraga: editFraga.fraga, beskrivning: editFraga.beskrivning || '', typ: editFraga.typ, min_varde: editFraga.min_varde ?? '', max_varde: editFraga.max_varde ?? '', max_langd: editFraga.max_langd ?? '200' } : undefined}
              onSave={saveFraga}
              onCancel={() => { setShowFragaForm(false); setEditFraga(null) }}
              saving={fragaSaving}
              error={fragaError}
            />
          </div>
        </div>
      )}
    </main>
  )
}
