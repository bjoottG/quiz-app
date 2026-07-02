import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function PUT(request, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { id } = await params
  const { username, password } = await request.json()
  const supabase = createServiceClient()
  const updates = {}
  if (username) updates.username = username.trim()
  if (password) updates.password_hash = await bcrypt.hash(password, 10)
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Inget att uppdatera' }, { status: 400 })
  const { error } = await supabase.from('spelledare').update(updates).eq('id', id)
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Användarnamnet är redan taget' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.from('spelledare').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
