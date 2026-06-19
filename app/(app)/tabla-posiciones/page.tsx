import { createClient } from '@/lib/supabase/server'
import Bandera from '@/app/components/Bandera'

type RankingStats = {
  user_id: string
  total_pronosticos: number
  marcadores_exactos: number
  ultimo_exacto_fecha: string | null
}

export default async function TablaPosicionesPage() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: statsRaw },
    { count: totalExactos },
  ] = await Promise.all([
    supabase.from('profiles').select('id, apodo, nombre, puntaje_total, pago_confirmado, nacionalidad'),
    supabase.rpc('get_ranking_stats'),
    supabase.from('pronosticos')
      .select('*', { count: 'exact', head: true })
      .eq('puntos_obtenidos', 3),
  ])

  const statsMap = new Map<string, RankingStats>()
  for (const s of (statsRaw as RankingStats[] | null) ?? []) {
    statsMap.set(s.user_id, s)
  }

  const ranking = (profiles ?? [])
    .map(p => {
      const s = statsMap.get(p.id)
      return {
        ...p,
        pronosticos:  s?.total_pronosticos  ?? 0,
        exactos:      s?.marcadores_exactos  ?? 0,
        ultimoExacto: s?.ultimo_exacto_fecha ?? null,
      }
    })
    .sort((a, b) => {
      if (b.puntaje_total !== a.puntaje_total) return b.puntaje_total - a.puntaje_total  // 1. pts DESC
      if (a.pronosticos   !== b.pronosticos)   return a.pronosticos   - b.pronosticos    // 2. pronósticos ASC
      if (b.exactos       !== a.exactos)       return b.exactos       - a.exactos        // 3. exactos DESC
      if (a.ultimoExacto === null && b.ultimoExacto === null) return 0                   // 4. último exacto DESC
      if (a.ultimoExacto === null) return 1
      if (b.ultimoExacto === null) return -1
      return b.ultimoExacto.localeCompare(a.ultimoExacto)
    })

  // KPIs
  const activos  = (profiles ?? []).filter(p => p.pago_confirmado)
  const nActivos = activos.length
  const promedio = nActivos > 0
    ? (activos.reduce((s, p) => s + p.puntaje_total, 0) / nActivos).toFixed(1)
    : '—'
  const maximo = nActivos > 0 ? Math.max(...activos.map(p => p.puntaje_total)) : 0

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">🏆 Tabla de Posiciones</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">👥</span>
          <p className="text-3xl font-bold text-gray-900">{nActivos}</p>
          <p className="text-xs text-gray-500 font-medium">jugadores activos</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">📊</span>
          <p className="text-3xl font-bold text-gray-900">{promedio}</p>
          <p className="text-xs text-gray-500 font-medium">promedio de puntos</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🏆</span>
          <p className="text-3xl font-bold text-gray-900">{maximo}</p>
          <p className="text-xs text-gray-500 font-medium">puntaje máximo</p>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-3xl font-bold text-gray-900">{totalExactos ?? 0}</p>
          <p className="text-xs text-gray-500 font-medium">marcadores exactos</p>
        </div>
      </div>

      {/* Ranking table */}
      <table className="w-full border rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Apodo</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-center p-2">Estado</th>
            <th className="text-right p-2">Pronósticos</th>
            <th className="text-right p-2">🎯</th>
            <th className="text-right p-2">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.id} className={`border-t ${i < 3 ? 'font-semibold bg-yellow-50' : ''}`}>
              <td className="p-2">{i + 1}</td>
              <td className="p-2">
                <span className="inline-flex items-center gap-1.5">
                  {r.nacionalidad && <Bandera equipo={r.nacionalidad} />}
                  {r.apodo}
                </span>
              </td>
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
              <td className="p-2 text-right text-green-700 font-medium">{r.exactos}</td>
              <td className="p-2 text-right">{r.puntaje_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
