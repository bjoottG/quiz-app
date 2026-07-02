import { NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const { username, password } = await request.json()
  if (!username || !password) return NextResponse.json({ error: 'Användarnamn och lösenord krävs' }, { status: 400 })
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('spelledare')
    .select('id, username, password_hash')
    .eq('username', username.trim())
    .maybeSingle()
  if (!data) return NextResponse.json({ error: 'Fel användarnamn eller lösenord' }, { status: 401 })
  const ok = await bcrypt.compare(password, data.password_hash)
  if (!ok) return NextResponse.json({ error: 'Fel användarnamn eller lösenord' }, { status: 401 })
  await createSession({ role: 'spelledare', id: data.id, username: data.username })
  return NextResponse.json({ ok: true })
}
