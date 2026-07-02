'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
            <input type="number" value={form.max_varde} onChange={e => setForm(f => ({ ...f, max_varde: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
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

function HanteraModal({ spelomgang, onClose, onRefresh }) {
  const [details, setDetails] = useState(null)
  const [live, setLive] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const liveInterval = useRef(null)

  const loadDetails = useCallback(async () => {
    const res = await fetch(`/api/spelledare/spelomgangar/${spelomgang.id}`)
    if (res.ok) setDetails(await res.json())
  }, [spelomgang.id])

  const loadLive = useCallback(async () => {
    const res = await fetch(`/api/spelledare/spelomgangar/${spelomgang.id}/live`)
    if (res.ok) setLive(await res.json())
  }, [spelomgang.id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  useEffect(() => {
    if (!details) return
    if (details.status === 'fas1') {
      loadLive()
      liveInterval.current = setInterval(loadLive, 3000)
    }
    return () => clearInterval(liveInterval.current)
  }, [details?.status, loadLive])

  async function doAction(status) {
    setActionLoading(true)
    await fetch(`/api/spelledare/spelomgangar/${spelomgang.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadDetails()
    onRefresh()
    setActionLoading(false)
  }

  async function doDelete() {
    setActionLoading(true)
    await fetch(`/api/spelledare/spelomgangar/${spelomgang.id}`, { method: 'DELETE' })
    onRefresh()
    onClose()
  }

  const s = details ?? spelomgang
  const statusLabel = { skapad: 'Ej startad', fas1: 'Fas 1 – Insamling pågår', fas2: 'Fas 2 – Sammanställning', avslutad: 'Avslutad' }
  const statusColor = { skapad: 'bg-gray-100 text-gray-600', fas1: 'bg-green-100 text-green-700', fas2: 'bg-blue-100 text-blue-700', avslutad: 'bg-gray-100 text-gray-500' }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{s.namn}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>{statusLabel[s.status]}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Spelkod */}
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <p className="text-xs text-violet-500 mb-1">Spelkod</p>
            <p className="text-4xl font-mono font-bold text-violet-700 tracking-widest">{s.kod}</p>
          </div>

          {/* Skapad – starta */}
          {s.status === 'skapad' && (
            <button onClick={() => doAction('fas1')} disabled={actionLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? 'Startar…' : '▶ Starta spelomgång'}
            </button>
          )}

          {/* Fas 1 – live + stoppa */}
          {s.status === 'fas1' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-violet-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-violet-700">{live?.antalSpelare ?? '…'}</p>
                  <p className="text-sm text-violet-600 mt-1">Spelare anslutna</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{live?.antalSvarade ?? '…'}</p>
                  <p className="text-sm text-green-600 mt-1">Har svarat klart</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Uppdateras var 3:e sekund</p>
              <button onClick={() => doAction('fas2')} disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {actionLoading ? 'Stoppar…' : '⏹ Stoppa insamling'}
              </button>
            </div>
          )}

          {/* Radera – alltid synlig */}
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="w-full py-2.5 border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm">
              Radera spelomgång
            </button>
          ) : (
            <div className="border border-red-200 rounded-xl p-3 bg-red-50">
              <p className="text-sm text-red-700 mb-3 text-center">Är du säker? All data raderas permanent.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50">Avbryt</button>
                <button onClick={doDelete} disabled={actionLoading}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {actionLoading ? 'Raderar…' : 'Ja, radera'}
                </button>
              </div>
            </div>
          )}

          {/* Fas 2 – svarstabell + avsluta */}
          {(s.status === 'fas2' || s.status === 'avslutad') && details && (
            <div className="space-y-4">
              {!details.spelare?.length ? (
                <p className="text-gray-400 text-sm text-center py-4">Inga svar insamlade.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm min-w-max">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-600 whitespace-nowrap">Spelare</th>
                        {details.fragor?.map(f => (
                          <th key={f.id} className="text-left py-2 px-3 font-medium text-gray-600">
                            <span className="block max-w-[140px] truncate" title={f.fraga}>{f.fraga}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {details.spelare.map(sp => (
                        <tr key={sp.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-800 whitespace-nowrap">{sp.namn}</td>
                          {details.fragor?.map(f => (
                            <td key={f.id} className="py-2 px-3 text-gray-600 max-w-[140px]">
                              <span className="block truncate" title={sp.svar?.[f.id] ?? ''}>
                                {sp.svar?.[f.id] ?? <span className="text-gray-300">–</span>}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.status === 'fas2' && (
                <button onClick={() => doAction('avslutad')} disabled={actionLoading}
                  className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {actionLoading ? 'Avslutar…' : 'Avsluta spelomgång'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SpelledareDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('spelomgangar')
  const [spelomgangar, setSpelomgangar] = useState([])
  const [allFragor, setAllFragor] = useState([])
  const [loading, setLoading] = useState(true)

  const [hanteraTarget, setHanteraTarget] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createNamn, setCreateNamn] = useState('')
  const [selectedFragaIds, setSelectedFragaIds] = useState(new Set())
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const [showFragaForm, setShowFragaForm] = useState(false)
  const [editFraga, setEditFraga] = useState(null)
  const [fragaError, setFragaError] = useState('')
  const [fragaSaving, setFragaSaving] = useState(false)

  async function load() {
    const [soRes, fRes] = await Promise.all([
      fetch('/api/spelledare/spelomgangar'),
      fetch('/api/spelledare/fragor'),
    ])
    if (soRes.status === 401) { router.push('/spelledare'); return }
    const [soData, fData] = await Promise.all([soRes.json(), fRes.json()])
    setSpelomgangar(soData)
    setAllFragor(fData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleLogout() {
    await fetch('/api/spelledare/logout', { method: 'POST' })
    router.push('/spelledare')
  }

  function openCreate() {
    setSelectedFragaIds(new Set(allFragor.map(f => f.id)))
    setCreateNamn('')
    setCreateError('')
    setShowCreateModal(true)
  }

  function toggleFraga(id) {
    setSelectedFragaIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (selectedFragaIds.size === 0) { setCreateError('Minst en fråga måste väljas'); return }
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/spelledare/spelomgangar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namn: createNamn.trim(), fraga_ids: [...selectedFragaIds] }),
    })
    if (res.ok) { setShowCreateModal(false); load() }
    else { const d = await res.json(); setCreateError(d.error || 'Fel') }
    setCreating(false)
  }

  async function saveFraga(form) {
    setFragaSaving(true)
    setFragaError('')
    const url = editFraga ? `/api/spelledare/fragor/${editFraga.id}` : '/api/spelledare/fragor'
    const method = editFraga ? 'PUT' : 'POST'
    const body = {
      fraga: form.fraga, beskrivning: form.beskrivning, typ: form.typ,
      min_varde: form.min_varde ? parseInt(form.min_varde) : null,
      max_varde: form.max_varde ? parseInt(form.max_varde) : null,
      max_langd: form.max_langd ? parseInt(form.max_langd) : 200,
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { setShowFragaForm(false); setEditFraga(null); load() }
    else { const d = await res.json(); setFragaError(d.error || 'Fel') }
    setFragaSaving(false)
  }

  async function deleteFraga(id) {
    if (!confirm('Ta bort frågan?')) return
    const res = await fetch(`/api/spelledare/fragor/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error) }
    else load()
  }

  const statusLabel = { skapad: 'Ej startad', fas1: 'Fas 1 – Insamling', fas2: 'Fas 2 – Sammanställning', avslutad: 'Avslutad' }
  const statusColor = { skapad: 'bg-gray-100 text-gray-600', fas1: 'bg-green-100 text-green-700', fas2: 'bg-blue-100 text-blue-700', avslutad: 'bg-gray-100 text-gray-500' }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-violet-600 text-sm hover:underline">← Start</Link>
          <h1 className="text-xl font-bold text-gray-900">Spelledare</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Logga ut</button>
      </header>

      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6 max-w-2xl mx-auto">
          {[['spelomgangar', 'Spelomgångar'], ['fragor', 'Underlagsfrågor']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {tab === 'spelomgangar' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{spelomgangar.length} spelomgång{spelomgangar.length !== 1 ? 'ar' : ''}</p>
              <button onClick={openCreate} className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">+ Ny spelomgång</button>
            </div>
            {loading ? <p className="text-gray-400 text-sm">Laddar…</p> :
              spelomgangar.length === 0 ? <p className="text-gray-400 text-sm">Inga spelomgångar ännu.</p> : (
                <div className="space-y-3">
                  {spelomgangar.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{s.namn}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>{statusLabel[s.status]}</span>
                        </div>
                        <span className="text-2xl font-mono font-bold text-violet-600 tracking-widest">{s.kod}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/spelledare/spelomgang/${s.id}`)}
                        className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
                      >
                        Hantera
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </>
        )}

        {tab === 'fragor' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Underlagsfrågor</h2>
              <button onClick={() => { setEditFraga(null); setFragaError(''); setShowFragaForm(true) }}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">+ Lägg till fråga</button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Du kan redigera och ta bort frågor du lagt till själv. Ursprungliga frågor hanteras av admin.</p>
            {loading ? <p className="text-gray-400 text-sm">Laddar…</p> :
              allFragor.length === 0 ? <p className="text-gray-400 text-sm">Inga frågor.</p> : (
                <div className="space-y-2">
                  {allFragor.map(f => {
                    const isOwn = !f.ar_ursprunglig && f.skapad_av_spelledare_id != null
                    return (
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
                          {isOwn && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => { setEditFraga(f); setFragaError(''); setShowFragaForm(true) }} className="text-sm text-violet-600 hover:underline">Redigera</button>
                              <button onClick={() => deleteFraga(f.id)} className="text-sm text-red-500 hover:underline">Ta bort</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </>
        )}
      </div>

      {/* Hantera modal */}
      {hanteraTarget && (
        <HanteraModal
          spelomgang={hanteraTarget}
          onClose={() => setHanteraTarget(null)}
          onRefresh={load}
        />
      )}

      {/* Skapa spelomgång modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md my-4">
            <h3 className="text-lg font-semibold mb-4">Ny spelomgång</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Namn</label>
                <input type="text" value={createNamn} onChange={e => setCreateNamn(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="t.ex. Fredagssällskapet" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Välj underlagsfrågor <span className="text-gray-400 font-normal">({selectedFragaIds.size} valda)</span>
                </label>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {allFragor.map(f => (
                    <label key={f.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={selectedFragaIds.has(f.id)} onChange={() => toggleFraga(f.id)}
                        className="mt-0.5 accent-violet-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{f.fraga}</p>
                        <div className="flex gap-1 mt-0.5">
                          <span className="text-xs text-gray-400">{f.typ === 'number' ? 'Siffror' : 'Fritext'}</span>
                          {f.ar_ursprunglig && <span className="text-xs text-violet-500">· Ursprunglig</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedFragaIds.size === 0 && <p className="text-xs text-red-500 mt-1">Minst en fråga måste väljas</p>}
              </div>
              {createError && <p className="text-red-600 text-sm">{createError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Avbryt</button>
                <button type="submit" disabled={creating || selectedFragaIds.size === 0}
                  className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {creating ? 'Skapar…' : 'Skapa'}
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
            <h3 className="text-lg font-semibold mb-4">{editFraga ? 'Redigera fråga' : 'Ny fråga'}</h3>
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
