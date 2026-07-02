import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient, generateUniqueKod } from '@/lib/supabase'

async function requireSpelledare() {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') return null
  return session
}

export async function GET() {
  const session = await requireSpelledare()
  if (!session) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('spelomgangar')
    .select('id, kod, namn, status, created_at')
    .eq('spelledare_id', session.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const session = await requireSpelledare()
  if (!session) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { namn, fraga_ids } = await request.json()
  if (!namn?.trim()) return NextResponse.json({ error: 'Namn krävs' }, { status: 400 })
  if (!fraga_ids?.length) return NextResponse.json({ error: 'Minst en fråga måste väljas' }, { status: 400 })

  const supabase = createServiceClient()
  const kod = await generateUniqueKod(supabase)

  const { data: spelomgang, error } = await supabase
    .from('spelomgangar')
    .insert({ namn: namn.trim(), kod, spelledare_id: session.id })
    .select('id, kod, namn, status')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch question order to set ordning correctly
  const { data: fragor } = await supabase
    .from('underlagsfragor')
    .select('id, ordning')
    .in('id', fraga_ids)

  const fragorMap = Object.fromEntries((fragor || []).map(f => [f.id, f.ordning]))

  const spelomgang_fragor = fraga_ids.map((fraga_id, i) => ({
    spelomgang_id: spelomgang.id,
    fraga_id,
    ordning: fragorMap[fraga_id] ?? i,
  }))

  await supabase.from('spelomgang_fragor').insert(spelomgang_fragor)

  return NextResponse.json(spelomgang, { status: 201 })
}
