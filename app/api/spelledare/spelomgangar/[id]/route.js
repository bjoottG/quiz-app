import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

async function requireOwner(id) {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('spelomgangar')
    .select('id, kod, namn, status, spelledare_id')
    .eq('id', id)
    .maybeSingle()
  if (!data || data.spelledare_id !== session.id) return null
  return { session, supabase, spelomgang: data }
}

export async function GET(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  const { supabase, spelomgang } = ctx

  // Fetch selected questions for this spelomgang
  const { data: fragaRows } = await supabase
    .from('spelomgang_fragor')
    .select('ordning, fraga:fraga_id(id, fraga, typ)')
    .eq('spelomgang_id', id)
    .order('ordning', { ascending: true })
  const fragor = (fragaRows || []).map(r => r.fraga)

  let spelare = []
  if (spelomgang.status !== 'skapad') {
    const { data: spelareData } = await supabase
      .from('spelare')
      .select('id, namn, har_svarat')
      .eq('spelomgang_id', id)
      .order('created_at', { ascending: true })

    if (spelareData?.length) {
      const { data: svarData } = await supabase
        .from('svar')
        .select('spelare_id, fraga_id, svar_text')
        .eq('spelomgang_id', id)

      spelare = spelareData.map(s => ({
        ...s,
        svar: Object.fromEntries(
          (svarData || []).filter(sv => sv.spelare_id === s.id).map(sv => [sv.fraga_id, sv.svar_text])
        ),
      }))
    }
  }

  return NextResponse.json({ ...spelomgang, fragor, spelare })
}

export async function PUT(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  const { namn } = await request.json()
  if (!namn?.trim()) return NextResponse.json({ error: 'Namn krävs' }, { status: 400 })
  const { error } = await ctx.supabase.from('spelomgangar').update({ namn: namn.trim() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const ctx = await requireOwner(id)
  if (!ctx) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  const { error } = await ctx.supabase.from('spelomgangar').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
