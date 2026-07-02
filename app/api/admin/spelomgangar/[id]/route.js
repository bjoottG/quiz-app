import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }
  const { id } = await params
  const supabase = createServiceClient()

  const { data: spelomgang } = await supabase
    .from('spelomgangar')
    .select('id, kod, namn, status, spelledare:spelledare_id(username)')
    .eq('id', id)
    .maybeSingle()
  if (!spelomgang) return NextResponse.json({ error: 'Inte hittad' }, { status: 404 })

  const { data: fragaRows } = await supabase
    .from('spelomgang_fragor')
    .select('ordning, fraga:fraga_id(id, fraga, typ)')
    .eq('spelomgang_id', id)
    .order('ordning', { ascending: true })
  const fragor = (fragaRows || []).map(r => r.fraga)

  let spelare = []
  if (spelomgang.status !== 'skapad') {
    const { data: spelareData } = await supabase
      .from('spelare')
      .select('id, namn, har_svarat')
      .eq('spelomgang_id', id)
      .order('created_at', { ascending: true })

    if (spelareData?.length) {
      const { data: svarData } = await supabase
        .from('svar')
        .select('spelare_id, fraga_id, svar_text')
        .eq('spelomgang_id', id)

      spelare = spelareData.map(s => ({
        ...s,
        svar: Object.fromEntries(
          (svarData || []).filter(sv => sv.spelare_id === s.id).map(sv => [sv.fraga_id, sv.svar_text])
        ),
      }))
    }
  }

  return NextResponse.json({ ...spelomgang, fragor, spelare })
}
