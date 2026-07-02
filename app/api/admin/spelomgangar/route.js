import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('spelomgangar')
    .select('id, kod, namn, status, created_at, spelledare:spelledare_id(id, username)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data || []).map(s => s.id)
  let spelareCounts = {}
  if (ids.length) {
    const { data: spelare } = await supabase
      .from('spelare')
      .select('spelomgang_id')
      .in('spelomgang_id', ids)
    for (const s of spelare || []) {
      spelareCounts[s.spelomgang_id] = (spelareCounts[s.spelomgang_id] ?? 0) + 1
    }
  }

  return NextResponse.json((data || []).map(s => ({ ...s, antal_spelare: spelareCounts[s.id] ?? 0 })))
}
