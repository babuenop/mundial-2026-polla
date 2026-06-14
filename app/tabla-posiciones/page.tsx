import { createClient } from '@/lib/supabase/server'

export default async function TablaPosicionesPage() {
  const supabase = await createClient()

  const { data: ranking } = await supabase
    .from('profiles')
    .select('apodo, nombre, puntaje_total')
    .order('puntaje_total', { ascending: false })

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🏆 Tabla de Posiciones</h1>
      <table className="w-full border rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Apodo</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-right p-2">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {ranking?.map((r, i) => (
            <tr key={r.apodo} className={`border-t ${i < 3 ? 'font-semibold bg-yellow-50' : ''}`}>
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{r.apodo}</td>
              <td className="p-2 text-gray-500">{r.nombre}</td>
              <td className="p-2 text-right">{r.puntaje_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}