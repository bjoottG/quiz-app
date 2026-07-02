import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

async function requireAdmin() {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('underlagsfragor')
    .select('id, fraga, beskrivning, typ, min_varde, max_varde, max_langd, ar_ursprunglig, ordning, skapad_av_spelledare_id, spelledare:skapad_av_spelledare_id(username)')
    .order('ordning', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { fraga, beskrivning, typ, min_varde, max_varde, max_langd } = await request.json()
  if (!fraga?.trim()) return NextResponse.json({ error: 'Frågetext krävs' }, { status: 400 })
  const supabase = createServiceClient()
  const { count } = await supabase.from('underlagsfragor').select('*', { count: 'exact', head: true })
  const { data, error } = await supabase
    .from('underlagsfragor')
    .insert({
      fraga: fraga.trim(),
      beskrivning: beskrivning?.trim() || null,
      typ: typ || 'text',
      min_varde: typ === 'number' ? min_varde : null,
      max_varde: typ === 'number' ? max_varde : null,
      max_langd: typ === 'text' ? (max_langd || 200) : null,
      ar_ursprunglig: true,
      ordning: (count || 0) + 1,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
