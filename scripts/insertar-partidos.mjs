import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import ws from 'ws'

const __dir = dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(readFileSync(resolve(__dir, '../worldcup2026.json'), 'utf8'))

const env = readFileSync(resolve(__dir, '../.env.local'), 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim()
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1].trim()
const supabase = createClient(url, key, { realtime: { transport: ws } })

await supabase.auth.signInWithPassword({ email: 'abuenop@hotmail.com', password: 'Saturno.82' })

function toUTC(date, timeField) {
  const [hhmm, utcOffset] = timeField.split(' ')
  const offsetHours = parseInt(utcOffset.replace('UTC', ''), 10)
  const local = new Date(`${date}T${hhmm}:00.000Z`)
  local.setUTCHours(local.getUTCHours() - offsetHours)
  return local.toISOString()
}

const esEquipoReal = (t) => t && t !== 'TBD' && !/[0-9]/.test(t)

const partidos = raw.matches
  .filter(m => esEquipoReal(m.team1) && esEquipoReal(m.team2))
  .map(m => ({
    fase:             m.group ?? m.round,
    equipo_local:     m.team1,
    equipo_visitante: m.team2,
    fecha_partido:    toUTC(m.date, m.time),
  }))

console.log(`Insertando ${partidos.length} partidos...`)

const { data, error } = await supabase.from('partidos').insert(partidos).select('id')

if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log(`✅ ${data.length} partidos insertados`)
}

await supabase.auth.signOut()
