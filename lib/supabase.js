import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function generateUniqueKod(supabase) {
  let kod
  let exists = true
  while (exists) {
    kod = String(Math.floor(1000 + Math.random() * 9000))
    const { data } = await supabase
      .from('spelomgangar')
      .select('id')
      .eq('kod', kod)
      .maybeSingle()
    exists = !!data
  }
  return kod
}
