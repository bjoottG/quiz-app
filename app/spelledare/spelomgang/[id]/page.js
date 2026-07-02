'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SpelomgangPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [editSpelareId, setEditSpelareId] = useState(null)
  const [editNamn, setEditNamn] = useState('')
  const [deleteSpelareId, setDeleteSpelareId] = useState(null)
  const [spelareLoading, setSpelareLoading] = useState(false)

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/spelledare/spelomgangar/${id}`)
    if (res.status === 401) { router.push('/spelledare'); return }
    if (res.status === 404) { router.push('/spelledare/dashboard'); return }
    setData(await res.json())
    setLoading(false)
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!data || data.status !== 'fas1') return
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [data?.status, loadData])

  async function setStatus(status) {
    setActionLoading(true)
    await fetch(`/api/spelledare/spelomgangar/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadData()
    setActionLoading(false)
  }

  async function doDelete() {
    setActionLoading(true)
    await fetch(`/api/spelledare/spelomgangar/${id}`, { method: 'DELETE' })
    router.push('/spelledare/dashboard')
  }

  async function saveSpelareNamn(spelareId) {
    if (!editNamn.trim()) return
    setSpelareLoading(true)
    await fetch(`/api/spelledare/spelare/${spelareId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namn: editNamn }),
    })
    setEditSpelareId(null)
    setSpelareLoading(false)
    loadData()
  }

  async function deleteSpelare(spelareId) {
    setSpelareLoading(true)
    await fetch(`/api/spelledare/spelare/${spelareId}`, { method: 'DELETE' })
    setDeleteSpelareId(null)
    setSpelareLoading(false)
    loadData()
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Laddar…</p>
    </main>
  )

  const statusLabel = { skapad: 'Ej startad', fas1: 'Fas 1 – Insamling pågår', fas2: 'Fas 2 – Sammanställning', avslutad: 'Avslutad' }
  const statusColor = { skapad: 'bg-gray-100 text-gray-600', fas1: 'bg-green-100 text-green-700', fas2: 'bg-blue-100 text-blue-700', avslutad: 'bg-gray-100 text-gray-500' }

  const antalSpelare = data.spelare?.length ?? 0
  const antalSvarade = data.spelare?.filter(s => s.har_svarat).length ?? 0

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/spelledare/dashboard" className="text-violet-600 text-sm hover:underline">← Tillbaka</Link>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{data.namn}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[data.status]}`}>{statusLabel[data.status]}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Spelkod */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Spelkod</p>
            <p className="text-4xl font-mono font-bold text-violet-600 tracking-widest">{data.kod}</p>
          </div>
          {data.status === 'fas1' && (
            <p className="text-xs text-gray-400">Uppdateras var 3:e sekund</p>
          )}
        </div>

        {/* Skapad – starta */}
        {data.status === 'skapad' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-4">Spelomgången är redo. Starta den för att låta spelare ansluta och svara på frågorna.</p>
            <button onClick={() => setStatus('fas1')} disabled={actionLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? 'Startar…' : '▶ Starta spelomgång'}
            </button>
          </div>
        )}

        {/* Fas 1 – live-räknare + stoppa */}
        {data.status === 'fas1' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-violet-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-violet-700">{antalSpelare}</p>
                <p className="text-sm text-violet-600 mt-1">Spelare anslutna</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-bold text-green-700">{antalSvarade}</p>
                <p className="text-sm text-green-600 mt-1">Har svarat klart</p>
              </div>
            </div>
            <button onClick={() => setStatus('fas2')} disabled={actionLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? 'Stoppar…' : '⏹ Stoppa insamling'}
            </button>
          </div>
        )}

        {/* Fas 2 – återstarta eller avsluta */}
        {data.status === 'fas2' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex gap-3">
            <button onClick={() => setStatus('fas1')} disabled={actionLoading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? '…' : '↺ Återstarta insamling'}
            </button>
            <button onClick={() => setStatus('avslutad')} disabled={actionLoading}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
              {actionLoading ? 'Avslutar…' : 'Avsluta spelomgång'}
            </button>
          </div>
        )}

        {/* Svarstabell – fas1, fas2, avslutad */}
        {data.status !== 'skapad' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                {data.status === 'fas1' ? 'Svar hittills' : 'Spelarnas svar'}
              </h2>
              {data.status === 'fas1' && (
                <span className="text-xs text-gray-400">{antalSpelare === 0 ? 'Väntar på spelare…' : `${antalSpelare} spelare`}</span>
              )}
            </div>

            {!data.spelare?.length ? (
              <p className="text-gray-400 text-sm p-6">
                {data.status === 'fas1' ? 'Inga spelare har anslutit än.' : 'Inga svar insamlade.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">Spelare</th>
                      {data.status === 'fas1' && (
                        <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">Status</th>
                      )}
                      {data.fragor?.map(f => (
                        <th key={f.id} className="text-left py-3 px-4 font-medium text-gray-600 min-w-[180px]">
                          {f.fraga}
                        </th>
                      ))}
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.spelare.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        {/* Namn – redigera inline */}
                        <td className="py-2 px-4 font-medium text-gray-800 whitespace-nowrap">
                          {editSpelareId === s.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                value={editNamn}
                                onChange={e => setEditNamn(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveSpelareNamn(s.id); if (e.key === 'Escape') setEditSpelareId(null) }}
                                className="border border-violet-400 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                autoFocus
                              />
                              <button onClick={() => saveSpelareNamn(s.id)} disabled={spelareLoading}
                                className="text-xs text-white bg-violet-600 hover:bg-violet-700 px-2 py-1 rounded disabled:opacity-50">
                                Spara
                              </button>
                              <button onClick={() => setEditSpelareId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700">
                                Avbryt
                              </button>
                            </div>
                          ) : (
                            s.namn
                          )}
                        </td>

                        {data.status === 'fas1' && (
                          <td className="py-2 px-4">
                            {s.har_svarat
                              ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Klar</span>
                              : <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">Svarar…</span>
                            }
                          </td>
                        )}

                        {data.fragor?.map(f => (
                          <td key={f.id} className="py-2 px-4 text-gray-600 min-w-[180px] whitespace-normal break-words align-top">
                            {s.svar?.[f.id] ?? <span className="text-gray-300">–</span>}
                          </td>
                        ))}

                        {/* Åtgärder */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {deleteSpelareId === s.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-red-600">Radera?</span>
                              <button onClick={() => deleteSpelare(s.id)} disabled={spelareLoading}
                                className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded disabled:opacity-50">
                                Ja
                              </button>
                              <button onClick={() => setDeleteSpelareId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700">
                                Nej
                              </button>
                            </div>
                          ) : editSpelareId !== s.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditSpelareId(s.id); setEditNamn(s.namn); setDeleteSpelareId(null) }}
                                className="text-xs text-violet-600 hover:underline">
                                Redigera
                              </button>
                              <button
                                onClick={() => { setDeleteSpelareId(s.id); setEditSpelareId(null) }}
                                className="text-xs text-red-500 hover:underline">
                                Radera
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.status === 'avslutad' && (
              <p className="text-center text-sm text-gray-400 px-6 py-4 border-t border-gray-50">Spelomgången är avslutad</p>
            )}
          </div>
        )}

        {/* Radera spelomgång */}
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            className="w-full py-2.5 border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm">
            Radera spelomgång
          </button>
        ) : (
          <div className="border border-red-200 rounded-xl p-4 bg-red-50">
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
      </div>
    </main>
  )
}
