'use client'

import { Fragment, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Bandera from '@/app/components/Bandera'

export type RankingRow = {
  id: string
  apodo: string
  puntaje_total: number
  puntos_fase: number
  pago_confirmado: boolean
  nacionalidad: string | null
  pronosticos: number
  exactos: number
  diferencia: number | null
}

type EstadisticasUsuario = {
  pct_aciertos: number
  racha: { puntos_obtenidos: number | null }[]
  mejor_jornada: string | null
  peor_jornada: string | null
}

function Flecha({ diferencia }: { diferencia: number | null }) {
  if (diferencia === null || diferencia === 0)
    return <span className="text-gray-400 text-xs">→</span>

  if (diferencia > 0)
    return (
      <span className="text-green-600 text-xs font-medium">
        ↑<span className="hidden sm:inline">{diferencia}</span>
      </span>
    )

  return (
    <span className="text-red-500 text-xs font-medium">
      ↓<span className="hidden sm:inline">{Math.abs(diferencia)}</span>
    </span>
  )
}

function iconoRacha(pts: number | null): string {
  if (pts === null) return '➖'
  if (pts === 3) return '🎯'
  if (pts === 1) return '✅'
  return '❌'
}

function formatFecha(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function PanelEstadisticas({
  datos,
  cargando,
}: {
  datos: EstadisticasUsuario | null
  cargando: boolean
}) {
  if (cargando) {
    return (
      <div className="py-3 px-4 text-center text-sm text-gray-400">
        Cargando estadísticas…
      </div>
    )
  }
  if (!datos) return null

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50">
      <div className="bg-white border rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Aciertos</p>
        <p className="text-base font-bold text-gray-800">{datos.pct_aciertos}%</p>
        <div className="mt-1.5 w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${datos.pct_aciertos}%` }}
          />
        </div>
      </div>

      <div className="bg-white border rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Últimos 5</p>
        <div className="flex gap-0.5 items-center flex-nowrap">
          {datos.racha.length > 0 ? (
            datos.racha.map((r, i) => (
              <span key={i} className="text-sm leading-none">
                {iconoRacha(r.puntos_obtenidos)}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">Sin datos</span>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Mejor día</p>
        <p className="text-base font-bold text-green-700">
          {formatFecha(datos.mejor_jornada)}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Peor día</p>
        <p className="text-base font-bold text-red-500">
          {formatFecha(datos.peor_jornada)}
        </p>
      </div>
    </div>
  )
}

export default function RankingTable({ ranking }: { ranking: RankingRow[] }) {
  const supabase = createClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cache, setCache] = useState<Record<string, EstadisticasUsuario>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRowClick = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null)
      return
    }
    setExpandedId(userId)
    if (cache[userId]) return

    setLoadingId(userId)
    const { data } = await supabase.rpc('get_estadisticas_usuario', {
      p_user_id: userId,
    })
    if (data) setCache(prev => ({ ...prev, [userId]: data as EstadisticasUsuario }))
    setLoadingId(null)
  }

  return (
    <table className="w-full border rounded-lg overflow-hidden text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="w-6 px-1 py-2" />
          <th className="w-6 text-left px-2 py-2">#</th>
          <th className="w-8 px-1 py-2" />
          <th className="text-left px-2 py-2">Apodo</th>
          <th className="hidden sm:table-cell text-center px-2 py-2">Estado</th>
          <th className="text-right px-2 py-2">Pronósticos</th>
          <th className="text-right px-2 py-2">🎯</th>
          <th className="text-right px-2 py-2">Puntos</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((r, i) => (
          <Fragment key={r.id}>
            <tr
              className={`border-t cursor-pointer select-none hover:bg-gray-50 active:bg-gray-100 ${
                i < 3
                  ? 'font-semibold bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200'
                  : ''
              }`}
              onClick={() => handleRowClick(r.id)}
            >
              <td className="w-6 px-1 py-2 text-center">
                <Flecha diferencia={r.diferencia} />
              </td>
              <td className="w-6 px-2 py-2">{i + 1}</td>
              <td className="w-8 px-1 py-2 text-center">
                {r.nacionalidad && <Bandera equipo={r.nacionalidad} />}
              </td>
              <td className="px-2 py-2">{r.apodo}</td>
              <td className="hidden sm:table-cell px-2 py-2 text-center">
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
              <td className="px-2 py-2 text-right text-gray-500">{r.pronosticos}</td>
              <td className="px-2 py-2 text-right text-green-700 font-medium">{r.exactos}</td>
              <td className="px-2 py-2 text-right">
                <span className="font-semibold">{r.puntos_fase}</span>
                {r.puntos_fase !== r.puntaje_total && (
                  <span className="block text-xs text-gray-400 leading-none">{r.puntaje_total} total</span>
                )}
              </td>
            </tr>
            {expandedId === r.id && (
              <tr className="border-t">
                <td colSpan={8} className="p-0">
                  <PanelEstadisticas
                    datos={cache[r.id] ?? null}
                    cargando={loadingId === r.id}
                  />
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
