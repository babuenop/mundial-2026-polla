import { createClient } from '@/lib/supabase/server'
import PronosticoForm from './PronosticoForm'
import DateNav from '@/app/components/DateNav'
import FaseFilter from '@/app/components/FaseFilter'
import { redirect } from 'next/navigation'
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

export default async function PronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoy = getTodayPanama()

  // Determine fase & fecha from params — validated against known values
  const faseParam = parseFaseParam(typeof params.fase === 'string' ? params.fase : undefined)
  const faseReq: FaseCategoria = faseParam ?? 'Fase de Grupos'
  const isGruposReq = esFaseGrupos(faseReq)

  const fechaParam = typeof params.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha)
    ? params.fecha : hoy
  const fecha = isGruposReq ? fechaParam : hoy
  const { start, end } = getDayRangeUTC(fecha)

  // All queries in parallel
  const [
    { data: fasesRaw },
    { data: todosFaseIds },
    { data: partidosDisplay },
    { data: pronosticosRaw },
    { data: profile },
    { data: finalizadosGlobal },
  ] = await Promise.all([
    // Distinct fases existing in DB (to build FaseFilter)
    supabase.from('partidos').select('fase'),

    // All partido IDs in the requested fase (for progress bar)
    isGruposReq
      ? supabase.from('partidos').select('id').ilike('fase', 'Group%')
      : supabase.from('partidos').select('id').eq('fase', faseReq),

    // Partidos to display
    isGruposReq
      ? supabase.from('partidos').select('*')
          .gte('fecha_partido', start)
          .lt('fecha_partido', end)
          .order('fecha_partido', { ascending: true })
      : supabase.from('partidos').select('*')
          .eq('fase', faseReq)
          .order('fecha_partido', { ascending: true }),

    // All own pronosticos (needed for map + progress)
    supabase.from('pronosticos').select('*').eq('user_id', user.id),

    // Profile
    supabase.from('profiles').select('puntaje_total, pago_confirmado').eq('id', user.id).single(),

    // Finalizados globales (for the summary card)
    supabase.from('partidos').select('id').eq('finalizado', true),
  ])

  // Build fase tabs from DB data
  const categoriasSet = new Set<FaseCategoria>()
  for (const r of fasesRaw ?? []) categoriasSet.add(normalizarFase(r.fase))
  const fasesDisponibles = FASES_ORDEN.filter(f => categoriasSet.has(f))

  // Validate faseReq against what actually exists; fall back to first available
  const faseActiva: FaseCategoria = fasesDisponibles.includes(faseReq)
    ? faseReq
    : (fasesDisponibles[0] ?? 'Fase de Grupos')
  const isGrupos = esFaseGrupos(faseActiva)

  // Pronosticos map (partido_id → pronostico)
  const pronosticosMap = new Map(pronosticosRaw?.map(p => [p.partido_id, p]))

  // Progress for the active fase
  const totalEnFase = todosFaseIds?.length ?? 0
  const conPronostico = todosFaseIds?.filter(p => pronosticosMap.has(p.id)).length ?? 0
  const sinPronostico = totalEnFase - conPronostico
  const pct = totalEnFase > 0 ? Math.round((conPronostico / totalEnFase) * 100) : 0

  // Global summary stats
  const totalFinalizados = finalizadosGlobal?.length ?? 0
  const jugadosGlobal = finalizadosGlobal?.filter(p => pronosticosMap.has(p.id)).length ?? 0

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Mis Pronósticos</h1>

      {/* Pago pendiente */}
      {profile?.pago_confirmado === false && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span className="font-semibold">🔒 Tu pago aún no fue confirmado.</span>{' '}
          Los pronósticos están bloqueados hasta que el admin confirme tu pago.
        </div>
      )}

      {/* Resumen global */}
      {totalFinalizados > 0 && (
        <div className="bg-gray-50 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total acumulado</p>
            <p className="text-3xl font-bold text-gray-900">
              {profile?.puntaje_total ?? 0}
              <span className="text-lg font-normal text-gray-500 ml-1">pts</span>
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Jugaste{' '}
            <span className="font-semibold text-gray-700">{jugadosGlobal}</span>
            {' '}de{' '}
            <span className="font-semibold text-gray-700">{totalFinalizados}</span>
            {' '}partido{totalFinalizados !== 1 ? 's' : ''} finalizado{totalFinalizados !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Filtro de fase */}
      {fasesDisponibles.length > 1 && (
        <FaseFilter
          fasesDisponibles={fasesDisponibles}
          faseActiva={faseActiva}
          basePath="/pronosticos"
          fechaActual={isGrupos ? fecha : undefined}
        />
      )}

      {/* Barra de progreso de la fase */}
      {totalEnFase > 0 && (
        <div className="border rounded-xl p-4 bg-white space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Progreso {faseActiva}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700">{conPronostico}</span>
            <span className="text-xl text-gray-400">/ {totalEnFase}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {sinPronostico > 0 ? (
            <p className="text-xs text-gray-400">
              {sinPronostico} partido{sinPronostico !== 1 ? 's' : ''} sin predicción
            </p>
          ) : (
            <p className="text-xs text-green-600 font-medium">¡Completaste todos los pronósticos de esta fase!</p>
          )}
        </div>
      )}

      {/* Navegación por fecha (solo Fase de Grupos) */}
      {isGrupos && (
        <div className="space-y-1">
          <DateNav
            fechaActual={fecha}
            hoy={hoy}
            basePath="/pronosticos"
            extraParams={{ fase: 'Fase de Grupos' }}
          />
          <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
        </div>
      )}

      {/* Sin partidos */}
      {(!partidosDisplay || partidosDisplay.length === 0) && (
        <div className="border rounded-xl p-6 bg-white text-center space-y-1">
          <p className="text-gray-600 font-medium">
            {isGrupos
              ? 'No hay partidos programados para esta fecha.'
              : `No hay partidos de ${faseActiva} programados aún.`}
          </p>
          {isGrupos && (
            <p className="text-sm text-gray-400">Usá los botones de arriba para navegar a otra fecha.</p>
          )}
        </div>
      )}

      {/* Formularios de pronóstico */}
      {partidosDisplay?.map((partido) => (
        <PronosticoForm
          key={partido.id}
          partido={partido}
          pronostico={pronosticosMap.get(partido.id)}
          userId={user.id}
          pagoConfirmado={profile?.pago_confirmado ?? false}
        />
      ))}
    </div>
  )
}
