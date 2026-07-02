import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request) {
  const session = await getSession()
  if (!session || session.role !== 'spelare') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const { svar, finalize = true } = await request.json()
  if (!Array.isArray(svar) || svar.length === 0) {
    return NextResponse.json({ error: 'Svar saknas' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: spelomgang } = await supabase
    .from('spelomgangar')
    .select('status')
    .eq('id', session.spelomgangId)
    .maybeSingle()

  if (!spelomgang || spelomgang.status !== 'fas1') {
    return NextResponse.json({ error: 'Insamlingen är stängd' }, { status: 400 })
  }

  const svarRows = svar.map(s => ({
    spelare_id: session.id,
    spelomgang_id: session.spelomgangId,
    fraga_id: s.fraga_id,
    svar_text: String(s.svar_text ?? '').trim().slice(0, 500),
  }))

  const { error } = await supabase
    .from('svar')
    .upsert(svarRows, { onConflict: 'spelare_id,fraga_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (finalize) {
    await supabase.from('spelare').update({ har_svarat: true }).eq('id', session.id)
  }

  return NextResponse.json({ ok: true })
}
