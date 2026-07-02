import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

const VALID_TRANSITIONS = {
  skapad: ['fas1'],
  fas1: ['fas2'],
  fas2: ['fas1', 'avslutad'],
}

export async function PATCH(request, { params }) {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }
  const { id } = await params
  const { status } = await request.json()
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('spelomgangar')
    .select('status, spelledare_id')
    .eq('id', id)
    .maybeSingle()
  if (!data || data.spelledare_id !== session.id) {
    return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  }
  if (!VALID_TRANSITIONS[data.status]?.includes(status)) {
    return NextResponse.json({ error: `Ogiltig övergång från ${data.status} till ${status}` }, { status: 400 })
  }

  const { error } = await supabase.from('spelomgangar').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Återstart: rensa svar och återställ har_svarat
  if (data.status === 'fas2' && status === 'fas1') {
    await supabase.from('svar').delete().eq('spelomgang_id', id)
    await supabase.from('spelare').update({ har_svarat: false }).eq('spelomgang_id', id)
  }

  return NextResponse.json({ ok: true })
}
