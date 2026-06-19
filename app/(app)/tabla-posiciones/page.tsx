import { createClient } from '@/lib/supabase/server'
import RankingTable, { type RankingRow } from './RankingTable'

type RankingStats = {
  user_id: string
  total_pronosticos: number
  marcadores_exactos: number
  ultimo_exacto_fecha: string | null
}

type HistorialPosicion = {
  user_id: string
  posicion_actual: number
  posicion_anterior: number | null
  diferencia: number | null
}

export default async function TablaPosicionesPage() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: statsRaw },
    { count: totalExactos },
    { data: historialRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('id, apodo, puntaje_total, pago_confirmado, nacionalidad'),
    supabase.rpc('get_ranking_stats'),
    supabase
      .from('pronosticos')
      .select('*', { count: 'exact', head: true })
      .eq('puntos_obtenidos', 3),
    supabase.rpc('get_historial_posiciones'),
  ])

  const statsMap = new Map<string, RankingStats>()
  for (const s of (statsRaw as RankingStats[] | null) ?? []) {
    statsMap.set(s.user_id, s)
  }

  const historialMap = new Map<string, HistorialPosicion>()
  for (const h of (historialRaw as HistorialPosicion[] | null) ?? []) {
    historialMap.set(h.user_id, h)
  }

  const ranked = (profiles ?? [])
    .map(p => {
      const s = statsMap.get(p.id)
      const h = historialMap.get(p.id)
      return {
        id:              p.id,
        apodo:           p.apodo,
        puntaje_total:   p.puntaje_total,
        pago_confirmado: p.pago_confirmado,
        nacionalidad:    p.nacionalidad ?? null,
        pronosticos:     s?.total_pronosticos  ?? 0,
        exactos:         s?.marcadores_exactos  ?? 0,
        ultimoExacto:    s?.ultimo_exacto_fecha ?? null,
        diferencia:      h?.diferencia ?? null,
      }
    })
    .sort((a, b) => {
      if (b.puntaje_total !== a.puntaje_total) return b.puntaje_total - a.puntaje_total
      if (a.pronosticos   !== b.pronosticos)   return a.pronosticos   - b.pronosticos
      if (b.exactos       !== a.exactos)       return b.exactos       - a.exactos
      if (a.ultimoExacto === null && b.ultimoExacto === null) return 0
      if (a.ultimoExacto === null) return 1
      if (b.ultimoExacto === null) return -1
      return b.ultimoExacto.localeCompare(a.ultimoExacto)
    })

  const ranking: RankingRow[] = ranked.map(({ ultimoExacto: _u, ...rest }) => rest)

  const activos  = (profiles ?? []).filter(p => p.pago_confirmado)
  const nActivos = activos.length
  const promedio = nActivos > 0
    ? (activos.reduce((s, p) => s + p.puntaje_total, 0) / nActivos).toFixed(1)
    : '—'
  const maximo = nActivos > 0 ? Math.max(...activos.map(p => p.puntaje_total)) : 0

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">🏆 Tabla de Posiciones</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">👥</span>
          <p className="text-3xl font-bold text-gray-900">{nActivos}</p>
          <p className="text-xs text-gray-500 font-medium">jugadores activos</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">📊</span>
          <p className="text-3xl font-bold text-gray-900">{promedio}</p>
          <p className="text-xs text-gray-500 font-medium">promedio de puntos</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🏆</span>
          <p className="text-3xl font-bold text-gray-900">{maximo}</p>
          <p className="text-xs text-gray-500 font-medium">puntaje máximo</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-3xl font-bold text-gray-900">{totalExactos ?? 0}</p>
          <p className="text-xs text-gray-500 font-medium">marcadores exactos</p>
        </div>
      </div>

      <RankingTable ranking={ranking} />
    </div>
  )
}
