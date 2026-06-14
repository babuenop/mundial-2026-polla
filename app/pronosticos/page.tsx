import { createClient } from '@/lib/supabase/server'
import PronosticoForm from './PronosticoForm'
import { redirect } from 'next/navigation'

export default async function PronosticosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha_partido', { ascending: true })

  const { data: pronosticos } = await supabase
    .from('pronosticos')
    .select('*')
    .eq('user_id', user.id)

  const pronosticosMap = new Map(pronosticos?.map((p) => [p.partido_id, p]))

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Mis Pronósticos - Mundial 2026</h1>
      {(!partidos || partidos.length === 0) && (
        <p className="text-gray-500">Aún no hay partidos cargados.</p>
      )}
      {partidos?.map((partido) => (
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