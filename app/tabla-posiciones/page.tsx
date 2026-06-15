import { createClient } from '@/lib/supabase/server'

export default async function TablaPosicionesPage() {
  const supabase = await createClient()

  const [{ data: profiles }, { data: pronosticos }] = await Promise.all([
    supabase.from('profiles').select('id, apodo, nombre, puntaje_total'),
    supabase.from('pronosticos').select('user_id'),
  ])

  // Count pronosticos per user
  const conteo = new Map<string, number>()
  for (const p of pronosticos ?? []) {
    conteo.set(p.user_id, (conteo.get(p.user_id) ?? 0) + 1)
  }

  // Sort: puntaje_total desc, then pronosticos asc (más eficiente gana el desempate)
  const ranking = (profiles ?? [])
    .map(p => ({ ...p, pronosticos: conteo.get(p.id) ?? 0 }))
    .sort((a, b) =>
      b.puntaje_total !== a.puntaje_total
        ? b.puntaje_total - a.puntaje_total
        : a.pronosticos - b.pronosticos
    )

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🏆 Tabla de Posiciones</h1>
      <table className="w-full border rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Apodo</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-right p-2">Pronósticos</th>
            <th className="text-right p-2">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.id} className={`border-t ${i < 3 ? 'font-semibold bg-yellow-50' : ''}`}>
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{r.apodo}</td>
              <td className="p-2 text-gray-500">{r.nombre}</td>
              <td className="p-2 text-right text-gray-500">{r.pronosticos}</td>
              <td className="p-2 text-right">{r.puntaje_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
