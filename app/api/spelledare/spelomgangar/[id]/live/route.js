import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session || session.role !== 'spelledare') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }
  const { id } = await params
  const supabase = createServiceClient()

  const { data: spelomgang } = await supabase
    .from('spelomgangar')
    .select('spelledare_id')
    .eq('id', id)
    .maybeSingle()
  if (!spelomgang || spelomgang.spelledare_id !== session.id) {
    return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })
  }

  const { count: antalSpelare } = await supabase
    .from('spelare')
    .select('*', { count: 'exact', head: true })
    .eq('spelomgang_id', id)

  const { count: antalSvarade } = await supabase
    .from('spelare')
    .select('*', { count: 'exact', head: true })
    .eq('spelomgang_id', id)
    .eq('har_svarat', true)

  return NextResponse.json({ antalSpelare: antalSpelare ?? 0, antalSvarade: antalSvarade ?? 0 })
}
