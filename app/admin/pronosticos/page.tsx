import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import DateNav from '@/app/components/DateNav'
import Link from 'next/link'
import PronosticoEditForm from './PronosticoEditForm'

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

type PronosticoFila = {
  id: string
  goles_local: number
  goles_visitante: number
  puntos_obtenidos: number
  profiles: { apodo: string } | null
}

export default async function AdminPronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const { fecha: fechaParam, partido_id: partidoParam } = await searchParams
  const hoy    = getTodayPanama()
  const fecha  = typeof fechaParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
    ? fechaParam : hoy
  const partidoSelId = typeof partidoParam === 'string' ? partidoParam : null

  const { start, end } = getDayRangeUTC(fecha)

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .gte('fecha_partido', start)
    .lt('fecha_partido', end)
    .order('fecha_partido', { ascending: true })

  const lista = (partidos as Partido[] | null) ?? []
  const partidoSel = lista.find(p => p.id === partidoSelId) ?? null

  let pronosticos: PronosticoFila[] = []
  if (partidoSel) {
    const { data } = await supabase
      .from('pronosticos')
      .select('id, goles_local, goles_visitante, puntos_obtenidos, profiles(apodo)')
      .eq('partido_id', partidoSel.id)
      .order('puntos_obtenidos', { ascending: false })
    pronosticos = (data as PronosticoFila[] | null) ?? []
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Editar pronósticos</h1>

      {/* Selector de fecha */}
      <div className="space-y-1 mb-5">
        <DateNav fechaActual={fecha} hoy={hoy} basePath="/admin/pronosticos" />
        <p className="text-sm text-gray-500 capitalize">{formatearFecha(fecha)}</p>
      </div>

      {lista.length === 0 ? (
        <div className="border rounded-xl p-6 bg-white text-center space-y-2">
          <p className="text-gray-600 font-medium">No hay partidos programados para esta fecha.</p>
          <p className="text-sm text-gray-400">
            Usá los botones de arriba para navegar a otra fecha.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {lista.map(p => (
            <Link
              key={p.id}
              href={`/admin/pronosticos?fecha=${fecha}&partido_id=${p.id}`}
              className={`block border rounded-xl px-4 py-3 bg-white shadow-sm text-sm transition-colors hover:border-gray-400 ${
                p.id === partidoSelId ? 'border-gray-800 ring-1 ring-gray-800' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-medium">{p.equipo_local} vs {p.equipo_visitante}</span>
                  <span className="text-gray-400 ml-2 text-xs">{p.fase}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {p.finalizado && (
                    <span className="text-green-600 font-medium">
                      {p.goles_local} – {p.goles_visitante} · Finalizado
                    </span>
                  )}
                  <span>
                    {new Date(p.fecha_partido).toLocaleString('es-ES', { timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pronósticos del partido seleccionado */}
      {partidoSel && (
        <div>
          <h2 className="text-base font-semibold mb-3">
            Pronósticos — {partidoSel.equipo_local} vs {partidoSel.equipo_visitante}
            {partidoSel.finalizado && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (resultado oficial: {partidoSel.goles_local} – {partidoSel.goles_visitante})
              </span>
            )}
          </h2>

          {pronosticos.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Ningún usuario hizo pronóstico para este partido.
            </p>
          ) : (
            <div className="space-y-2">
              {pronosticos.map(pron => (
                <PronosticoEditForm
                  key={pron.id}
                  pronostico={{
                    id:               pron.id,
                    goles_local:      pron.goles_local,
                    goles_visitante:  pron.goles_visitante,
                    puntos_obtenidos: pron.puntos_obtenidos,
                  }}
                  apodo={pron.profiles?.apodo ?? '—'}
                  partidoId={partidoSel.id}
                  partidoFinalizado={partidoSel.finalizado}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
