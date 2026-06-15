import { createClient } from '@/lib/supabase/server'

type ExactoRow = {
  user_id: string
  partidos: { fecha_partido: string } | null
}

export default async function TablaPosicionesPage() {
  const supabase = await createClient()

  const [{ data: profiles }, { data: pronosticos }, { data: exactosRaw }] = await Promise.all([
    supabase.from('profiles').select('id, apodo, nombre, puntaje_total, pago_confirmado'),
    supabase.from('pronosticos').select('user_id'),
    supabase.from('pronosticos')
      .select('user_id, partidos(fecha_partido)')
      .eq('puntos_obtenidos', 3),
  ])

  const conteo = new Map<string, number>()
  for (const p of pronosticos ?? []) {
    conteo.set(p.user_id, (conteo.get(p.user_id) ?? 0) + 1)
  }

  const ultimoExacto = new Map<string, string>()
  for (const e of (exactosRaw as ExactoRow[] | null) ?? []) {
    const fecha = e.partidos?.fecha_partido
    if (!fecha) continue
    const prev = ultimoExacto.get(e.user_id)
    if (!prev || fecha > prev) ultimoExacto.set(e.user_id, fecha)
  }

  const ranking = (profiles ?? [])
    .map(p => ({
      ...p,
      pronosticos:  conteo.get(p.id) ?? 0,
      ultimoExacto: ultimoExacto.get(p.id) ?? null,
    }))
    .sort((a, b) => {
      if (b.puntaje_total !== a.puntaje_total) return b.puntaje_total - a.puntaje_total
      if (a.pronosticos   !== b.pronosticos)   return a.pronosticos   - b.pronosticos
      if (a.ultimoExacto === null && b.ultimoExacto === null) return 0
      if (a.ultimoExacto === null) return 1
      if (b.ultimoExacto === null) return -1
      return b.ultimoExacto.localeCompare(a.ultimoExacto)
    })

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🏆 Tabla de Posiciones</h1>
      <table className="w-full border rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Apodo</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-center p-2">Estado</th>
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
              <td className="p-2 text-center">
                {r.pago_confirmado ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    ✅ Activo
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    ⏳ Pago pendiente
                  </span>
                )}
              </td>
              <td className="p-2 text-right text-gray-500">{r.pronosticos}</td>
              <td className="p-2 text-right">{r.puntaje_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
