'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  pronostico: {
    id: string
    goles_local: number
    goles_visitante: number
    puntos_obtenidos: number
  }
  apodo: string
  partidoId: string
  partidoFinalizado: boolean
}

export default function PronosticoEditForm({ pronostico, apodo, partidoId, partidoFinalizado }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [editando, setEditando]           = useState(false)
  const [golesLocal, setGolesLocal]       = useState(pronostico.goles_local)
  const [golesVisitante, setGolesVisitante] = useState(pronostico.goles_visitante)
  const [loading, setLoading]             = useState(false)
  const [mensaje, setMensaje]             = useState<string | null>(null)

  const handleGuardar = async () => {
    setLoading(true)
    setMensaje(null)

    const { error: errUpdate } = await supabase
      .from('pronosticos')
      .update({
        goles_local:     golesLocal,
        goles_visitante: golesVisitante,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', pronostico.id)

    if (errUpdate) {
      setLoading(false)
      setMensaje(`Error: ${errUpdate.message}`)
      return
    }

    // Si el partido ya tiene resultado oficial, recalcular puntos de todos
    if (partidoFinalizado) {
      const { error: errRpc } = await supabase.rpc('calcular_puntos', { p_partido_id: partidoId })
      if (errRpc) {
        setLoading(false)
        setMensaje(`Pronóstico actualizado, pero error al recalcular puntos: ${errRpc.message}`)
        return
      }
    }

    setLoading(false)
    setMensaje('✅ Guardado' + (partidoFinalizado ? ' y puntos recalculados' : ''))
    setEditando(false)
    router.refresh()
  }

  const handleCancelar = () => {
    setGolesLocal(pronostico.goles_local)
    setGolesVisitante(pronostico.goles_visitante)
    setMensaje(null)
    setEditando(false)
  }

  return (
    <div className={`border rounded-xl px-4 py-3 bg-white shadow-sm text-sm ${editando ? 'border-gray-400' : ''}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="font-medium w-32 truncate">{apodo}</span>

          {editando ? (
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={20} value={golesLocal}
                onChange={e => setGolesLocal(Number(e.target.value))}
                className="w-14 text-center border rounded-md py-1"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number" min={0} max={20} value={golesVisitante}
                onChange={e => setGolesVisitante(Number(e.target.value))}
                className="w-14 text-center border rounded-md py-1"
              />
            </div>
          ) : (
            <span className="tabular-nums text-gray-700 font-medium">
              {pronostico.goles_local} – {pronostico.goles_visitante}
            </span>
          )}

          {partidoFinalizado && !editando && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              pronostico.puntos_obtenidos === 3 ? 'bg-green-100 text-green-700' :
              pronostico.puntos_obtenidos === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-gray-100 text-gray-500'
            }`}>
              +{pronostico.puntos_obtenidos} pts
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editando ? (
            <>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={handleCancelar}
                disabled={loading}
                className="border px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => { setMensaje(null); setEditando(true) }}
              className="border px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-50"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <p className={`text-xs mt-2 ${mensaje.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {mensaje}
        </p>
      )}
    </div>
  )
}
