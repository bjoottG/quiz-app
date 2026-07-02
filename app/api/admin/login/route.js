import { NextResponse } from 'next/server'
import { createSession } from '@/lib/session'

const ADMIN_PASSWORD = 'alto255'

export async function POST(request) {
  const { password } = await request.json()
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Fel lösenord' }, { status: 401 })
  }
  await createSession({ role: 'admin' })
  return NextResponse.json({ ok: true })
}
