import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('spelledare')
    .select('id, username, created_at')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { username, password } = await request.json()
  if (!username || !password) return NextResponse.json({ error: 'Användarnamn och lösenord krävs' }, { status: 400 })
  const supabase = createServiceClient()
  const password_hash = await bcrypt.hash(password, 10)
  const { error } = await supabase.from('spelledare').insert({ username: username.trim(), password_hash })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Användarnamnet är redan taget' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
