import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import ws from 'ws'

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim()
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1].trim()
const supabase = createClient(url, key, { realtime: { transport: ws } })

await supabase.auth.signInWithPassword({ email: 'abuenop@hotmail.com', password: 'Saturno.82' })

// Replica exacta de la query en page.tsx
const { data: partidos, error } = await supabase
  .from('partidos')
  .select('*')
  .order('fecha_partido', { ascending: true })

console.log('Error:', error?.message ?? 'ninguno')
console.log('Total partidos devueltos:', partidos?.length ?? 0)
partidos?.forEach(p => {
  console.log(`  ${p.equipo_local} vs ${p.equipo_visitante} | finalizado=${p.finalizado} | fecha=${p.fecha_partido}`)
})

await supabase.auth.signOut()
