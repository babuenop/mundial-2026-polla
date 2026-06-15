import { createClient } from '@/lib/supabase/server'
import PronosticoForm from './PronosticoForm'
import DateNav from '../components/DateNav'
import { redirect } from 'next/navigation'

// Panama = UTC-5, sin DST
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

  const { fecha: fechaParam } = await searchParams
  const hoy = getTodayPanama()
  const fecha = typeof fechaParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
    ? fechaParam
    : hoy

  const { start, end } = getDayRangeUTC(fecha)

  const [
    { data: partidosDia },
    { data: finalizadosGlobal },
    { data: pronosticos },
    { data: profile },
  ] = await Promise.all([
    // Todos los partidos del día seleccionado (sin filtro de now())
    supabase.from('partidos').select('*')
      .gte('fecha_partido', start)
      .lt('fecha_partido', end)
      .order('fecha_partido', { ascending: true }),
    // Solo ids de partidos finalizados globales (para el resumen)
    supabase.from('partidos').select('id').eq('finalizado', true),
    // Todos los pronósticos del usuario (para mapa y estadísticas globales)
    supabase.from('pronosticos').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('puntaje_total, pago_confirmado').eq('id', user.id).single(),
  ])

  const pronosticosMap = new Map(pronosticos?.map((p) => [p.partido_id, p]))

  // Estadísticas globales (no filtradas por fecha)
  const totalFinalizados = finalizadosGlobal?.length ?? 0
  const jugadosGlobal = finalizadosGlobal?.filter((p) => pronosticosMap.has(p.id)).length ?? 0

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Mis Pronósticos</h1>

      {/* Banner de pago pendiente */}
      {profile?.pago_confirmado === false && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span className="font-semibold">⏳ Tu pago aún no fue confirmado.</span>{' '}
          Podés seguir haciendo pronósticos, pero confirmá tu pago con el admin para entrar al pozo.
        </div>
      )}

      {/* Resumen global de puntos */}
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

      {/* Navegación de fecha */}
      <div className="space-y-1">
        <DateNav fechaActual={fecha} hoy={hoy} basePath="/pronosticos" />
        <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
      </div>

      {/* Sin partidos para la fecha */}
      {(!partidosDia || partidosDia.length === 0) && (
        <div className="border rounded-xl p-6 bg-white text-center space-y-1">
          <p className="text-gray-600 font-medium">No hay partidos programados para esta fecha.</p>
          <p className="text-sm text-gray-400">Usá los botones de arriba para navegar a otra fecha.</p>
        </div>
      )}

      {partidosDia?.map((partido) => (
        <PronosticoForm
          key={partido.id}
          partido={partido}
          pronostico={pronosticosMap.get(partido.id)}
          userId={user.id}
        />
      ))}
    </div>
  )
}
