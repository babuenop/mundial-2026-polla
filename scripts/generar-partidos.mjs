import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(readFileSync(resolve(__dir, '../worldcup2026.json'), 'utf8'))

// Convierte "2026-06-11" + "13:00 UTC-6" → "2026-06-11T19:00:00Z"
function toUTC(date, timeField) {
  const [hhmm, utcOffset] = timeField.split(' ')           // "13:00", "UTC-6"
  const [hh, mm] = hhmm.split(':').map(Number)
  const offsetHours = parseInt(utcOffset.replace('UTC', ''), 10) // -6
  const local = new Date(`${date}T${hhmm}:00.000Z`)        // pretend it's UTC
  local.setUTCHours(local.getUTCHours() - offsetHours)     // subtract offset (e.g., -(-6) = +6)
  return local.toISOString()
}

// Excluye equipos no definidos: TBD, vacíos, o placeholders tipo "2A" / "W101"
const esEquipoReal = (t) => t && t !== 'TBD' && !/[0-9]/.test(t)

const partidos = raw.matches
  .filter(m => esEquipoReal(m.team1) && esEquipoReal(m.team2))
  .map(m => ({
    fase:             m.group ?? m.round,
    equipo_local:     m.team1,
    equipo_visitante: m.team2,
    fecha_partido:    toUTC(m.date, m.time),
  }))

// Genera SQL
const esc = (s) => s.replace(/'/g, "''")
const rows = partidos.map(p =>
  `  ('${esc(p.fase)}', '${esc(p.equipo_local)}', '${esc(p.equipo_visitante)}', '${p.fecha_partido}')`
)

const sql = `-- Partidos Mundial 2026 (${partidos.length} filas, sin TBD/knockout sin resolver)
-- Generado el ${new Date().toISOString()}

INSERT INTO public.partidos (fase, equipo_local, equipo_visitante, fecha_partido) VALUES
${rows.join(',\n')}
ON CONFLICT DO NOTHING;
`

const outPath = resolve(__dir, '../partidos-mundial2026.sql')
writeFileSync(outPath, sql)

// Preview en consola
console.log(`\n✅ ${partidos.length} partidos (omitidos con TBD/placeholder: ${raw.matches.length - partidos.length})\n`)
console.log('Primeros 5:')
partidos.slice(0, 5).forEach(p =>
  console.log(`  ${p.fase} | ${p.equipo_local} vs ${p.equipo_visitante} | ${p.fecha_partido}`)
)
console.log('...')
console.log('Últimos 3:')
partidos.slice(-3).forEach(p =>
  console.log(`  ${p.fase} | ${p.equipo_local} vs ${p.equipo_visitante} | ${p.fecha_partido}`)
)
console.log(`\nSQL guardado en: partidos-mundial2026.sql`)
