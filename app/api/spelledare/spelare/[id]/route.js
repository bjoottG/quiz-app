import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

async function requireOwner(spelareId) {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') return null
  const supabase = createServiceClient()
  const { data: spelare } = await supabase
    .from('spelare')
    .select('id, spelomgang_id')
    .eq('id', spelareId)
    .maybeSingle()
  if (!spelare) return null
  const { data: spelomgang } = await supabase
    .from('spelomgangar')
    .select('spelledare_id')
    .eq('id', spelare.spelomgang_id)
    .maybeSingle()
  if (!spelomgang || spelomgang.spelledare_id !== session.id) return null
  return { supabase, spelare }
}

export async function PUT(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  const { namn } = await request.json()
  if (!namn?.trim()) return NextResponse.json({ error: 'Namn krävs' }, { status: 400 })
  const { error } = await ctx.supabase.from('spelare').update({ namn: namn.trim() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  const { error } = await ctx.supabase.from('spelare').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
