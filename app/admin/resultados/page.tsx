import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import ResultadoForm from './ResultadoForm'
import DateNav from '@/app/components/DateNav'

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

  const { fecha: fechaParam } = await searchParams
  const hoy = getTodayPanama()
  const fecha = typeof fechaParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
    ? fechaParam
    : hoy

  const { start, end } = getDayRangeUTC(fecha)

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .gte('fecha_partido', start)
    .lt('fecha_partido', end)
    .order('fecha_partido', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cargar resultados</h1>

      <div className="space-y-1 mb-5">
        <DateNav fechaActual={fecha} hoy={hoy} basePath="/admin/resultados" />
        <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
      </div>

      {(!partidos || partidos.length === 0) ? (
        <div className="border rounded-xl p-6 bg-white text-center space-y-2">
          <p className="text-gray-600 font-medium">No hay partidos programados para esta fecha.</p>
          <p className="text-sm text-gray-400">
            Usá los botones de arriba para navegar a otra fecha, o volvé a{' '}
            <a href="/admin/resultados" className="underline text-gray-600 hover:text-gray-900">Hoy</a>.
          </p>
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
