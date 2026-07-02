'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminSpelomgangPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/admin/spelomgangar/${id}`)
    if (res.status === 401) { router.push('/admin'); return }
    if (res.status === 404) { router.push('/admin/dashboard'); return }
    setData(await res.json())
    setLoading(false)
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!data || data.status !== 'fas1') return
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [data?.status, loadData])

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
        <Link href="/admin/dashboard" className="text-violet-600 text-sm hover:underline">← Tillbaka</Link>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">{data.namn}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[data.status]}`}>{statusLabel[data.status]}</span>
          <span className="text-sm text-gray-400">av {data.spelledare?.username ?? '–'}</span>
        </div>
        <span className="text-xs text-gray-400 italic">Skrivskyddad</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Info-rad */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-8">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Spelkod</p>
            <p className="text-3xl font-mono font-bold text-violet-600 tracking-widest">{data.kod}</p>
          </div>
          {data.status !== 'skapad' && (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{antalSpelare}</p>
                <p className="text-xs text-gray-400">Spelare</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">{antalSvarade}</p>
                <p className="text-xs text-gray-400">Svarat klart</p>
              </div>
            </>
          )}
        </div>

        {/* Svarstabell */}
        {data.status !== 'skapad' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Spelarnas svar</h2>
            </div>
            {!data.spelare?.length ? (
              <p className="text-gray-400 text-sm p-6">Inga spelare har anslutit än.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">Spelare</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">Status</th>
                      {data.fragor?.map(f => (
                        <th key={f.id} className="text-left py-3 px-4 font-medium text-gray-600">
                          <span className="block max-w-[200px] truncate" title={f.fraga}>{f.fraga}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.spelare.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{s.namn}</td>
                        <td className="py-3 px-4">
                          {s.har_svarat
                            ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Klar</span>
                            : <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">Svarar…</span>
                          }
                        </td>
                        {data.fragor?.map(f => (
                          <td key={f.id} className="py-3 px-4 text-gray-600 max-w-[200px]">
                            <span className="block truncate" title={s.svar?.[f.id] ?? ''}>
                              {s.svar?.[f.id] ?? <span className="text-gray-300">–</span>}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {data.status === 'skapad' && (
          <p className="text-gray-400 text-sm text-center py-8">Spelomgången har inte startats än.</p>
        )}
      </div>
    </main>
  )
}
