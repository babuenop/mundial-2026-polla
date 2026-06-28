import { createClient } from '@/lib/supabase/server'
import RankingTable, { type RankingRow } from './RankingTable'
import FaseFilter from '@/app/components/FaseFilter'
import {
  normalizarFase, esFaseGrupos, parseFaseParam,
  FASES_ORDEN, type FaseCategoria,
} from '@/lib/fases'

type HistorialPosicion = {
  user_id: string
  posicion_actual: number
  posicion_anterior: number | null
  diferencia: number | null
}

export default async function TablaPosicionesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const faseParam = parseFaseParam(typeof params.fase === 'string' ? params.fase : undefined)
  const faseReq: FaseCategoria = faseParam ?? 'Fase de Grupos'

  const [
    { data: profiles },
    { count: totalExactos },
    { data: historialRaw },
    { data: fasesRaw },
    { data: pronosticosConFase },
  ] = await Promise.all([
    supabase.from('profiles').select('id, apodo, puntaje_total, pago_confirmado, nacionalidad'),
    supabase.from('pronosticos').select('*', { count: 'exact', head: true }).eq('puntos_obtenidos', 3),
    supabase.rpc('get_historial_posiciones'),
    supabase.from('partidos').select('fase'),
    supabase.from('pronosticos').select('user_id, puntos_obtenidos, partidos(fase)'),
  ])

  // Build available fases from DB
  const categoriasSet = new Set<FaseCategoria>()
  for (const r of fasesRaw ?? []) categoriasSet.add(normalizarFase(r.fase))
  const fasesDisponibles = FASES_ORDEN.filter(f => categoriasSet.has(f))

  const faseActiva: FaseCategoria = fasesDisponibles.includes(faseReq)
    ? faseReq
    : (fasesDisponibles[0] ?? 'Fase de Grupos')
  const isGrupos = esFaseGrupos(faseActiva)

  // Aggregate fase-specific points per user in JS (744 rows, trivial)
  const puntajesFaseMap = new Map<string, { puntos: number; pronosticos: number; exactos: number }>()
  for (const pr of pronosticosConFase ?? []) {
    const raw = pr.partidos as unknown as { fase: string } | { fase: string }[] | null
    const fasePart: string = (Array.isArray(raw) ? raw[0]?.fase : raw?.fase) ?? ''
    const matches = isGrupos ? fasePart.startsWith('Group') : fasePart === faseActiva
    if (!matches) continue
    const curr = puntajesFaseMap.get(pr.user_id) ?? { puntos: 0, pronosticos: 0, exactos: 0 }
    puntajesFaseMap.set(pr.user_id, {
      puntos:       curr.puntos       + (pr.puntos_obtenidos ?? 0),
      pronosticos:  curr.pronosticos  + 1,
      exactos:      curr.exactos      + (pr.puntos_obtenidos === 3 ? 1 : 0),
    })
  }

  const historialMap = new Map<string, HistorialPosicion>()
  for (const h of (historialRaw as HistorialPosicion[] | null) ?? []) {
    historialMap.set(h.user_id, h)
  }

  const ranking: RankingRow[] = (profiles ?? [])
    .map(p => {
      const f = puntajesFaseMap.get(p.id) ?? { puntos: 0, pronosticos: 0, exactos: 0 }
      const h = historialMap.get(p.id)
      return {
        id:              p.id,
        apodo:           p.apodo,
        puntaje_total:   p.puntaje_total,
        puntos_fase:     f.puntos,
        pago_confirmado: p.pago_confirmado,
        nacionalidad:    p.nacionalidad ?? null,
        pronosticos:     f.pronosticos,
        exactos:         f.exactos,
        diferencia:      h?.diferencia ?? null,
      }
    })
    .sort((a, b) => {
      if (b.puntos_fase !== a.puntos_fase) return b.puntos_fase - a.puntos_fase
      if (b.exactos     !== a.exactos)     return b.exactos     - a.exactos
      return a.pronosticos - b.pronosticos
    })

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
          <p className="text-xs text-gray-500 font-medium">promedio total</p>
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

      {fasesDisponibles.length > 1 && (
        <FaseFilter
          fasesDisponibles={fasesDisponibles}
          faseActiva={faseActiva}
          basePath="/tabla-posiciones"
        />
      )}

      <RankingTable ranking={ranking} />
    </div>
  )
}
