'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Bandera from '@/app/components/Bandera'
import { Partido } from '@/lib/types'
import { SIGUIENTE_SLOT, calcularGanador } from '@/lib/bracketProgression'

type Pronostico = {
  partido_id: string
  goles_local: number
  goles_visitante: number
  puntos_obtenidos: number
}

const PUNTOS_CFG = {
  3: { cls: 'bg-green-50 border-green-300 text-green-700', label: '¡Marcador exacto! +3' },
  1: { cls: 'bg-yellow-50 border-yellow-300 text-yellow-700', label: 'Resultado correcto +1' },
  0: { cls: 'bg-red-50 border-red-200 text-red-400', label: 'No acertaste +0' },
} as const

function calcEstado(partido: Partido) {
  const now = Date.now()
  const kickoff = new Date(partido.fecha_partido).getTime()
  const enVivoHasta = kickoff + 2.5 * 60 * 60 * 1000
  if (partido.finalizado) return 'finalizado'
  if (now >= kickoff && now < enVivoHasta) return 'en_vivo'
  return 'proximo'
}

// ── Admin modal ───────────────────────────────────────────────────────────────
function ModalResultado({
  partido,
  onClose,
  onGuardado,
}: {
  partido: Partido
  onClose: () => void
  onGuardado: () => void
}) {
  const supabase = createClient()
  const [golesLocal, setGolesLocal] = useState<string>(partido.goles_local?.toString() ?? '')
  const [golesVisitante, setGolesVisitante] = useState<string>(partido.goles_visitante?.toString() ?? '')
  const [conPenales, setConPenales] = useState(
    partido.penales_local != null || partido.penales_visitante != null
  )
  const [penalesLocal, setPenalesLocal] = useState<string>(partido.penales_local?.toString() ?? '')
  const [penalesVisitante, setPenalesVisitante] = useState<string>(partido.penales_visitante?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGuardar = async () => {
    setError(null)
    setLoading(true)

    const gL = golesLocal === '' ? null : parseInt(golesLocal)
    const gV = golesVisitante === '' ? null : parseInt(golesVisitante)
    const pL = conPenales && penalesLocal !== '' ? parseInt(penalesLocal) : null
    const pV = conPenales && penalesVisitante !== '' ? parseInt(penalesVisitante) : null

    // 1. Save the result
    const { error: err } = await supabase
      .from('partidos')
      .update({ goles_local: gL, goles_visitante: gV, penales_local: pL, penales_visitante: pV, finalizado: true })
      .eq('id', partido.id)

    if (err) { setLoading(false); setError(err.message); return }

    // 2. Propagate winner to next bracket slot (if bracket_slot is set)
    if (partido.bracket_slot && gL != null && gV != null) {
      const ganador = calcularGanador(partido.equipo_local, partido.equipo_visitante, gL, gV, pL, pV)
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
    onGuardado()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-base">
          {partido.equipo_local} vs {partido.equipo_visitante}
        </h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{partido.equipo_local}</p>
            <input type="number" min={0} max={20} value={golesLocal}
              onChange={e => setGolesLocal(e.target.value)}
              className="w-full text-center border rounded-lg py-2 text-lg font-bold" />
          </div>
          <span className="text-gray-400 font-bold mt-5">–</span>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{partido.equipo_visitante}</p>
            <input type="number" min={0} max={20} value={golesVisitante}
              onChange={e => setGolesVisitante(e.target.value)}
              className="w-full text-center border rounded-lg py-2 text-lg font-bold" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={conPenales} onChange={e => setConPenales(e.target.checked)}
              className="rounded" />
            Hubo penales
          </label>
          {conPenales && (
            <div className="flex gap-3 items-center mt-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Penales {partido.equipo_local}</p>
                <input type="number" min={0} max={20} value={penalesLocal}
                  onChange={e => setPenalesLocal(e.target.value)}
                  className="w-full text-center border rounded-lg py-2 font-bold" />
              </div>
              <span className="text-gray-400 font-bold mt-5">–</span>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Penales {partido.equipo_visitante}</p>
                <input type="number" min={0} max={20} value={penalesVisitante}
                  onChange={e => setPenalesVisitante(e.target.value)}
                  className="w-full text-center border rounded-lg py-2 font-bold" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={loading}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function PartidoEliminatoriaCard({
  partido,
  pronostico,
  isAdmin,
}: {
  partido: Partido
  pronostico: Pronostico | null
  isAdmin: boolean
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const estado = calcEstado(partido)

  const fechaStr = new Date(partido.fecha_partido).toLocaleString('es-ES', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  const tienePenales = partido.penales_local != null && partido.penales_visitante != null

  const winnerLocal = tienePenales
    ? (partido.penales_local! > partido.penales_visitante!)
    : (partido.goles_local != null && partido.goles_visitante != null && partido.goles_local > partido.goles_visitante!)
  const winnerVisitante = tienePenales
    ? (partido.penales_visitante! > partido.penales_local!)
    : (partido.goles_local != null && partido.goles_visitante != null && partido.goles_visitante > partido.goles_local!)

  const pts = pronostico?.puntos_obtenidos
  const puntosConfig = (estado === 'finalizado' && pts != null)
    ? PUNTOS_CFG[pts as 0 | 1 | 3]
    : null

  return (
    <>
      <div
        className={`border rounded-xl p-4 bg-white shadow-sm ${estado === 'en_vivo' ? 'border-red-300' : ''} ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={() => isAdmin && setModalOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="font-semibold text-gray-500">{partido.fase}</span>
          <div className="flex items-center gap-2">
            {estado === 'en_vivo' && (
              <span className="animate-pulse bg-red-600 text-white font-bold px-2 py-0.5 rounded-full tracking-wide">
                EN VIVO
              </span>
            )}
            {estado === 'finalizado' && (
              <span className="text-green-600 font-medium">✓ Finalizado</span>
            )}
            <span>{fechaStr}</span>
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center gap-3">
          {/* Local */}
          <div className={`flex-1 flex items-center gap-2 justify-end ${winnerLocal ? 'font-bold' : 'font-medium'}`}>
            <span className="text-right text-sm leading-tight">{partido.equipo_local}</span>
            <Bandera equipo={partido.equipo_local} />
          </div>

          {/* Score */}
          <div className="text-center w-24 shrink-0">
            {estado === 'finalizado' ? (
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {partido.goles_local} – {partido.goles_visitante}
                </div>
                {tienePenales && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    pen. {partido.penales_local} – {partido.penales_visitante}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400 font-semibold">vs</span>
            )}
          </div>

          {/* Visitante */}
          <div className={`flex-1 flex items-center gap-2 ${winnerVisitante ? 'font-bold' : 'font-medium'}`}>
            <Bandera equipo={partido.equipo_visitante} />
            <span className="text-sm leading-tight">{partido.equipo_visitante}</span>
          </div>
        </div>

        {/* User pronostico */}
        {pronostico && (
          <div className="mt-3 space-y-1">
            <p className="text-center text-xs text-gray-500">
              Tu pronóstico:{' '}
              <span className="font-semibold text-gray-700 tabular-nums">
                {pronostico.goles_local} – {pronostico.goles_visitante}
              </span>
            </p>
            {puntosConfig && (
              <div className={`border rounded-lg px-3 py-1 text-center text-xs font-semibold ${puntosConfig.cls}`}>
                {puntosConfig.label}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <p className="text-right text-xs text-purple-500 mt-2">★ Editar resultado</p>
        )}
      </div>

      {modalOpen && (
        <ModalResultado
          partido={partido}
          onClose={() => setModalOpen(false)}
          onGuardado={() => { setModalOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
