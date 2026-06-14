'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Partido, Pronostico } from '@/lib/types'

interface Props {
  partido: Partido
  pronostico?: Pronostico | null
  userId: string
}

export default function PronosticoForm({ partido, pronostico, userId }: Props) {
  const supabase = createClient()
  const [golesLocal, setGolesLocal] = useState<number>(pronostico?.goles_local ?? 0)
  const [golesVisitante, setGolesVisitante] = useState<number>(pronostico?.goles_visitante ?? 0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const fechaLimite = new Date(partido.fecha_partido).getTime() - 15 * 60 * 1000
  const bloqueado = Date.now() > fechaLimite || partido.finalizado

  const handleSubmit = async () => {
    if (bloqueado) return
    setLoading(true)
    setMensaje(null)

    const { error } = await supabase
      .from('pronosticos')
      .upsert(
        {
          user_id: userId,
          partido_id: partido.id,
          goles_local: golesLocal,
          goles_visitante: golesVisitante,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,partido_id' }
      )

    setLoading(false)
    setMensaje(error ? `Error: ${error.message}` : 'Pronóstico guardado ✅')
  }

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">{partido.fase}</span>
        <span className="text-xs text-gray-400">
          {new Date(partido.fecha_partido).toLocaleString('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="font-bold text-lg w-32 text-right">{partido.equipo_local}</span>

        <input
          type="number"
          min={0}
          max={20}
          value={golesLocal}
          disabled={bloqueado}
          onChange={(e) => setGolesLocal(Number(e.target.value))}
          className="w-14 text-center border rounded-md py-1 disabled:bg-gray-100"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          min={0}
          max={20}
          value={golesVisitante}
          disabled={bloqueado}
          onChange={(e) => setGolesVisitante(Number(e.target.value))}
          className="w-14 text-center border rounded-md py-1 disabled:bg-gray-100"
        />

        <span className="font-bold text-lg w-32">{partido.equipo_visitante}</span>
      </div>

      {partido.finalizado && (
        <p className="text-center text-sm text-green-600 mb-2">
          Resultado oficial: {partido.goles_local} - {partido.goles_visitante}
          {pronostico && <> · Obtuviste {pronostico.puntos_obtenidos} pts</>}
        </p>
      )}

      <div className="flex justify-center">
        {bloqueado ? (
          <span className="text-sm text-red-500 font-medium">🔒 Pronósticos cerrados</span>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar pronóstico'}
          </button>
        )}
      </div>

      {mensaje && <p className="text-center text-xs mt-2 text-gray-600">{mensaje}</p>}
    </div>
  )
}