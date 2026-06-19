'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Partido } from '@/lib/types'
import Bandera from '@/app/components/Bandera'

interface Props {
  partido: Partido
}

export default function ResultadoForm({ partido }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [golesLocal, setGolesLocal] = useState<number>(partido.goles_local ?? 0)
  const [golesVisitante, setGolesVisitante] = useState<number>(partido.goles_visitante ?? 0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setMensaje(null)

    const { error } = await supabase
      .from('partidos')
      .update({
        goles_local: golesLocal,
        goles_visitante: golesVisitante,
        finalizado: true,
      })
      .eq('id', partido.id)

    setLoading(false)

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setMensaje('Resultado guardado. Puntos calculados.')
      router.refresh()
    }
  }

  return (
    <div className={`border rounded-xl px-4 py-3 shadow-sm bg-white text-sm ${partido.finalizado ? 'border-green-300 bg-green-50' : ''}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="font-medium"><Bandera equipo={partido.equipo_local} /> {partido.equipo_local} vs <Bandera equipo={partido.equipo_visitante} /> {partido.equipo_visitante}</span>
          <span className="text-gray-400 ml-2 text-xs">{partido.fase}</span>
          <span className="text-gray-400 ml-2 text-xs">
            {new Date(partido.fecha_partido).toLocaleString('es-ES', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          {partido.finalizado && (
            <span className="ml-2 text-xs text-green-600 font-medium">✓ Finalizado</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={golesLocal}
            onChange={(e) => setGolesLocal(Number(e.target.value))}
            className="w-14 text-center border rounded-md py-1"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            max={20}
            value={golesVisitante}
            onChange={(e) => setGolesVisitante(Number(e.target.value))}
            className="w-14 text-center border rounded-md py-1"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
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
