import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

async function requireAdmin() {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function PUT(request, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { id } = await params
  const { fraga, beskrivning, typ, min_varde, max_varde, max_langd } = await request.json()
  if (!fraga?.trim()) return NextResponse.json({ error: 'Frågetext krävs' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from('underlagsfragor').update({
    fraga: fraga.trim(),
    beskrivning: beskrivning?.trim() || null,
    typ: typ || 'text',
    min_varde: typ === 'number' ? (min_varde ?? null) : null,
    max_varde: typ === 'number' ? (max_varde ?? null) : null,
    max_langd: typ === 'text' ? (max_langd || 200) : null,
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('spelomgang_fragor')
    .select('*', { count: 'exact', head: true })
    .eq('fraga_id', id)
  if (count > 0) return NextResponse.json({ error: 'Frågan används i en eller flera spelomgångar och kan inte tas bort' }, { status: 409 })
  const { error } = await supabase.from('underlagsfragor').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
