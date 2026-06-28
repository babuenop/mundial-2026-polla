'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Partido } from '@/lib/types'
import Bandera from '@/app/components/Bandera'
import { SIGUIENTE_SLOT, calcularGanador } from '@/lib/bracketProgression'

interface Props {
  partido: Partido
}

// Whether this fase uses penalty shootouts
function esFaseEliminatoria(fase: string): boolean {
  return !fase.startsWith('Group')
}

export default function ResultadoForm({ partido }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [golesLocal, setGolesLocal] = useState<number>(partido.goles_local ?? 0)
  const [golesVisitante, setGolesVisitante] = useState<number>(partido.goles_visitante ?? 0)
  const [conPenales, setConPenales] = useState(
    partido.penales_local != null || partido.penales_visitante != null
  )
  const [penalesLocal, setPenalesLocal] = useState<number | ''>(partido.penales_local ?? '')
  const [penalesVisitante, setPenalesVisitante] = useState<number | ''>(partido.penales_visitante ?? '')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const esElim = esFaseEliminatoria(partido.fase)

  const handleSubmit = async () => {
    setLoading(true)
    setMensaje(null)

    const payload: Record<string, unknown> = {
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      finalizado: true,
    }
    if (esElim) {
      payload.penales_local = conPenales && penalesLocal !== '' ? penalesLocal : null
      payload.penales_visitante = conPenales && penalesVisitante !== '' ? penalesVisitante : null
    }

    const { error } = await supabase
      .from('partidos')
      .update(payload)
      .eq('id', partido.id)

    if (error) {
      setLoading(false)
      setMensaje(`Error: ${error.message}`)
      return
    }

    // Propagate winner to next bracket slot
    if (partido.bracket_slot) {
      const pL = esElim && conPenales && penalesLocal !== '' ? Number(penalesLocal) : null
      const pV = esElim && conPenales && penalesVisitante !== '' ? Number(penalesVisitante) : null
      const ganador = calcularGanador(partido.equipo_local, partido.equipo_visitante, golesLocal, golesVisitante, pL, pV)
      const siguiente = SIGUIENTE_SLOT[partido.bracket_slot]
      if (ganador && siguiente) {
        const campo = siguiente.posicion === 'local' ? 'equipo_local' : 'equipo_visitante'
        await supabase
          .from('partidos')
          .update({ [campo]: ganador })
          .eq('bracket_slot', siguiente.slot)
      }
    }

    setLoading(false)
    setMensaje('Resultado guardado.')
    router.refresh()
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

        <div className="flex items-center gap-2 flex-wrap">
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
          {esElim && (
            <>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={conPenales}
                  onChange={e => setConPenales(e.target.checked)}
                  className="rounded"
                />
                Pen.
              </label>
              {conPenales && (
                <>
                  <input
                    type="number"
                    min={0}
                    placeholder="P.L"
                    value={penalesLocal}
                    onChange={e => setPenalesLocal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 text-center border rounded-md py-1 text-xs"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="P.V"
                    value={penalesVisitante}
                    onChange={e => setPenalesVisitante(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 text-center border rounded-md py-1 text-xs"
                  />
                </>
              )}
            </>
          )}
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
