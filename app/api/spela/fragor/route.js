import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'spelare') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('spelomgang_fragor')
    .select('ordning, fraga:fraga_id(id, fraga, beskrivning, typ, min_varde, max_varde, max_langd)')
    .eq('spelomgang_id', session.spelomgangId)
    .order('ordning', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(r => r.fraga))
}
