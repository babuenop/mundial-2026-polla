import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Partido } from '@/lib/types'
import DateNav from '@/app/components/DateNav'
import FaseFilter from '@/app/components/FaseFilter'
import {
  normalizarFase, esFaseGrupos, parseFaseParam,
  FASES_ORDEN, type FaseCategoria,
} from '@/lib/fases'
import Bandera from '@/app/components/Bandera'

type PronosticoFila = {
  partido_id: string
  goles_local: number
  goles_visitante: number
  puntos_obtenidos: number
  profiles: { apodo: string } | null
}

type EstadoPartido = 'en_vivo' | 'esperando_resultado' | 'finalizado'

function estadoPartido(p: Partido): EstadoPartido {
  if (p.finalizado) return 'finalizado'
  const now = Date.now()
  const kickoff = new Date(p.fecha_partido).getTime()
  return now < kickoff + 2.5 * 60 * 60 * 1000 ? 'en_vivo' : 'esperando_resultado'
}

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

export default async function PronosticosTodosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoy = getTodayPanama()
  const now = new Date().toISOString()

  // Determine fase & fecha from params
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
    { data: partidos },
  ] = await Promise.all([
    supabase.from('partidos').select('fase'),

    // Partidos ya comenzados: filtrados por fecha (grupos) o por fase completa (eliminación)
    isGruposReq
      ? supabase.from('partidos').select('*')
          .gte('fecha_partido', start)
          .lt('fecha_partido', end)
          .lte('fecha_partido', now)
          .order('fecha_partido', { ascending: true })
      : supabase.from('partidos').select('*')
          .eq('fase', faseReq)
          .lte('fecha_partido', now)
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

  // Fetch pronosticos for the visible partidos
  const partidoIds = (partidos as Partido[] | null)?.map(p => p.id) ?? []
  let pronosticos: PronosticoFila[] = []
  if (partidoIds.length > 0) {
    const { data } = await supabase
      .from('pronosticos')
      .select('partido_id, goles_local, goles_visitante, puntos_obtenidos, profiles(apodo)')
      .in('partido_id', partidoIds)
    pronosticos = (data as PronosticoFila[] | null) ?? []
  }

  const porPartido = new Map<string, PronosticoFila[]>()
  for (const p of pronosticos) {
    const list = porPartido.get(p.partido_id) ?? []
    list.push(p)
    porPartido.set(p.partido_id, list)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <h1 className="text-2xl font-bold">Pronósticos de la comunidad</h1>

      {/* Filtro de fase */}
      {fasesDisponibles.length > 1 && (
        <FaseFilter
          fasesDisponibles={fasesDisponibles}
          faseActiva={faseActiva}
          basePath="/pronosticos-todos"
          fechaActual={isGrupos ? fecha : undefined}
        />
      )}

      {/* Navegación por fecha (solo Fase de Grupos) */}
      {isGrupos && (
        <div className="space-y-1">
          <DateNav
            fechaActual={fecha}
            hoy={hoy}
            basePath="/pronosticos-todos"
            extraParams={{ fase: 'Fase de Grupos' }}
          />
          <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
        </div>
      )}

      {/* Sin partidos */}
      {(!partidos || partidos.length === 0) && (
        <div className="border rounded-xl p-6 bg-white text-center space-y-1">
          <p className="text-gray-600 font-medium">
            {isGrupos
              ? 'No hay partidos en vivo o finalizados para esta fecha.'
              : `No hay partidos de ${faseActiva} comenzados aún.`}
          </p>
          {isGrupos && (
            <p className="text-sm text-gray-400">Usá los botones de arriba para navegar a otra fecha.</p>
          )}
        </div>
      )}

      {(partidos as Partido[] | null)?.map((partido) => {
        const estado = estadoPartido(partido)
        const filas = (porPartido.get(partido.id) ?? []).sort((a, b) =>
          estado === 'finalizado'
            ? b.puntos_obtenidos - a.puntos_obtenidos
            : (a.profiles?.apodo ?? '').localeCompare(b.profiles?.apodo ?? '')
        )

        const nExactos   = filas.filter(f => f.puntos_obtenidos === 3).length
        const nResultado = filas.filter(f => f.puntos_obtenidos === 1).length
        const nFallaron  = filas.filter(f => f.puntos_obtenidos === 0).length

        return (
          <div key={partido.id} className="border rounded-xl shadow-sm bg-white overflow-hidden">
            {/* Cabecera del partido */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${estado === 'en_vivo' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div>
                <p className="text-xs font-semibold text-gray-500">{partido.fase}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-bold text-sm">
                    <Bandera equipo={partido.equipo_local} /> {partido.equipo_local}{' '}
                    <span className="font-normal text-gray-400">vs</span>{' '}
                    <Bandera equipo={partido.equipo_visitante} /> {partido.equipo_visitante}
                  </p>
                  {estado === 'en_vivo' && (
                    <span className="animate-pulse bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      🔴 EN VIVO
                    </span>
                  )}
                  {estado === 'esperando_resultado' && (
                    <span className="text-xs text-gray-400 font-medium">⏳ Esperando resultado</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {new Date(partido.fecha_partido).toLocaleString('es-ES', { timeStyle: 'short' })}
                </p>
                {estado === 'finalizado' && (
                  <p className="text-lg font-bold tabular-nums text-gray-800 mt-0.5">
                    {partido.goles_local} – {partido.goles_visitante}
                  </p>
                )}
              </div>
            </div>

            {/* Resumen de aciertos (solo partidos finalizados) */}
            {estado === 'finalizado' && filas.length > 0 && (
              <div className="px-4 py-2 border-b bg-white flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="font-medium text-green-700">✅ Exacto: {nExactos}</span>
                <span className="font-medium text-yellow-700">🟡 Resultado: {nResultado}</span>
                <span className="font-medium text-gray-500">❌ Fallaron: {nFallaron}</span>
              </div>
            )}

            {filas.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-4 py-3">
                Nadie hizo pronóstico para este partido.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Jugador</th>
                    <th className="text-center px-4 py-2 font-medium">Pronóstico</th>
                    <th className="text-center px-4 py-2 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={i} className="border-t last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-700">{f.profiles?.apodo ?? '—'}</td>
                      <td className="px-4 py-2 text-center tabular-nums text-gray-600">
                        {f.goles_local} – {f.goles_visitante}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {estado === 'finalizado' ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            f.puntos_obtenidos === 3 ? 'bg-green-100 text-green-700' :
                            f.puntos_obtenidos === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-gray-100 text-gray-500'
                          }`}>
                            {f.puntos_obtenidos === 3 ? '✅' : f.puntos_obtenidos === 1 ? '🟡' : '❌'}
                            +{f.puntos_obtenidos}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
