import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import ResultadoForm from './ResultadoForm'
import DateNav from '@/app/components/DateNav'
import FaseFilter from '@/app/components/FaseFilter'
import {
  normalizarFase, esFaseGrupos, parseFaseParam,
  FASES_ORDEN, type FaseCategoria,
} from '@/lib/fases'

const PANAMA_OFFSET_MS = 5 * 60 * 60 * 1000

function getTodayPanama(): string {
  return new Date(Date.now() - PANAMA_OFFSET_MS).toISOString().slice(0, 10)
}

function getDayRangeUTC(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00-05:00`)
  const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString() }
}

function formatearFecha(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function AdminResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const params = await searchParams
  const hoy = getTodayPanama()

  // Determine fase & fecha from params
  const faseParam = parseFaseParam(typeof params.fase === 'string' ? params.fase : undefined)
  const faseReq: FaseCategoria = faseParam ?? 'Fase de Grupos'
  const isGruposReq = esFaseGrupos(faseReq)

  const fechaParam = typeof params.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha)
    ? params.fecha : hoy
  const fecha = isGruposReq ? fechaParam : hoy
  const { start, end } = getDayRangeUTC(fecha)

  const [
    { data: fasesRaw },
    { data: partidos },
  ] = await Promise.all([
    supabase.from('partidos').select('fase'),

    // Admin sees ALL partidos (no lte now() restriction): by date (grupos) or full fase (eliminación)
    isGruposReq
      ? supabase.from('partidos').select('*')
          .gte('fecha_partido', start)
          .lt('fecha_partido', end)
          .order('fecha_partido', { ascending: true })
      : supabase.from('partidos').select('*')
          .eq('fase', faseReq)
          .order('fecha_partido', { ascending: true }),
  ])

  // Build fase tabs
  const categoriasSet = new Set<FaseCategoria>()
  for (const r of fasesRaw ?? []) categoriasSet.add(normalizarFase(r.fase))
  const fasesDisponibles = FASES_ORDEN.filter(f => categoriasSet.has(f))

  const faseActiva: FaseCategoria = fasesDisponibles.includes(faseReq)
    ? faseReq
    : (fasesDisponibles[0] ?? 'Fase de Grupos')
  const isGrupos = esFaseGrupos(faseActiva)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cargar resultados</h1>

      {/* Filtro de fase */}
      {fasesDisponibles.length > 1 && (
        <div className="mb-4">
          <FaseFilter
            fasesDisponibles={fasesDisponibles}
            faseActiva={faseActiva}
            basePath="/admin/resultados"
            fechaActual={isGrupos ? fecha : undefined}
          />
        </div>
      )}

      {/* Navegación por fecha (solo Fase de Grupos) */}
      {isGrupos && (
        <div className="space-y-1 mb-5">
          <DateNav
            fechaActual={fecha}
            hoy={hoy}
            basePath="/admin/resultados"
            extraParams={{ fase: 'Fase de Grupos' }}
          />
          <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
        </div>
      )}

      {/* Sin partidos */}
      {(!partidos || partidos.length === 0) ? (
        <div className="border rounded-xl p-6 bg-white text-center space-y-2">
          <p className="text-gray-600 font-medium">
            {isGrupos
              ? 'No hay partidos programados para esta fecha.'
              : `No hay partidos de ${faseActiva} programados aún.`}
          </p>
          {isGrupos && (
            <p className="text-sm text-gray-400">
              Usá los botones de arriba para navegar a otra fecha, o volvé a{' '}
              <a href="/admin/resultados" className="underline text-gray-600 hover:text-gray-900">Hoy</a>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(partidos as Partido[]).map((p) => (
            <ResultadoForm key={p.id} partido={p} />
          ))}
        </div>
      )}
    </div>
  )
}
