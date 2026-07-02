import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

async function requireOwner(id) {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('underlagsfragor')
    .select('id, skapad_av_spelledare_id, ar_ursprunglig')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  if (data.skapad_av_spelledare_id !== session.id) return null
  return { session, supabase, fraga: data }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  const { fraga, beskrivning, typ, min_varde, max_varde, max_langd } = await request.json()
  if (!fraga?.trim()) return NextResponse.json({ error: 'Frågetext krävs' }, { status: 400 })
  const { error } = await ctx.supabase.from('underlagsfragor').update({
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
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  const { count } = await ctx.supabase
    .from('spelomgang_fragor')
    .select('*', { count: 'exact', head: true })
    .eq('fraga_id', id)
  if (count > 0) return NextResponse.json({ error: 'Frågan används i en eller flera spelomgångar och kan inte tas bort' }, { status: 409 })
  const { error } = await ctx.supabase.from('underlagsfragor').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
