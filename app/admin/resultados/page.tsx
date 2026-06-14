import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import ResultadoForm from './ResultadoForm'

export default async function AdminResultadosPage() {
  const supabase = await createClient()

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha_partido', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cargar resultados</h1>

      {(!partidos || partidos.length === 0) ? (
        <p className="text-sm text-gray-500">Aún no hay partidos cargados.</p>
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
