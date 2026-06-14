import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import PartidoForm from './PartidoForm'

export default async function AdminPartidosPage() {
  const supabase = await createClient()

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha_partido', { ascending: true })

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Crear partido</h1>
        <PartidoForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Partidos cargados</h2>
        {(!partidos || partidos.length === 0) ? (
          <p className="text-sm text-gray-500">Aún no hay partidos.</p>
        ) : (
          <div className="space-y-2">
            {(partidos as Partido[]).map((p) => (
              <div key={p.id} className="border rounded-xl px-4 py-3 bg-white shadow-sm text-sm flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.equipo_local} vs {p.equipo_visitante}</span>
                  <span className="text-gray-400 ml-3 text-xs">{p.fase}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(p.fecha_partido).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
