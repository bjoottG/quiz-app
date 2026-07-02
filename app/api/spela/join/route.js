import { NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request) {
  const { namn, kod } = await request.json()
  if (!namn?.trim() || !kod) {
    return NextResponse.json({ error: 'Namn och kod krävs' }, { status: 400 })
  }
  if (!/^\d{4}$/.test(kod)) {
    return NextResponse.json({ error: 'Koden måste vara 4 siffror' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: spelomgang } = await supabase
    .from('spelomgangar')
    .select('id, status')
    .eq('kod', kod)
    .maybeSingle()

  if (!spelomgang) {
    return NextResponse.json({ error: 'Koden hittades inte' }, { status: 404 })
  }
  if (spelomgang.status !== 'fas1') {
    return NextResponse.json({ error: 'Denna spelomgång tar inte emot spelare just nu' }, { status: 400 })
  }

  const { data: spelare, error } = await supabase
    .from('spelare')
    .insert({ namn: namn.trim(), spelomgang_id: spelomgang.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await createSession({
    role: 'spelare',
    id: spelare.id,
    spelomgangId: spelomgang.id,
    namn: namn.trim(),
  })

  return NextResponse.json({ ok: true })
}
