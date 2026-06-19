'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Partido, Pronostico } from '@/lib/types'
import Bandera from '@/app/components/Bandera'

interface Props {
  partido: Partido
  pronostico?: Pronostico | null
  userId: string
  pagoConfirmado: boolean
}

type EstadoPartido = 'proximo' | 'bloqueado' | 'en_vivo' | 'esperando_resultado' | 'finalizado'

function calcularEstado(partido: Partido): EstadoPartido {
  if (partido.finalizado) return 'finalizado'
  const now = Date.now()
  const kickoff = new Date(partido.fecha_partido).getTime()
  const limite = kickoff - 15 * 60 * 1000
  const enVivoHasta = kickoff + 2.5 * 60 * 60 * 1000
  if (now >= kickoff && now < enVivoHasta) return 'en_vivo'
  if (now >= enVivoHasta) return 'esperando_resultado'
  if (now >= limite) return 'bloqueado'
  return 'proximo'
}

const PUNTOS_CONFIG = {
  3: { wrapper: 'bg-green-50 border-green-300', text: 'text-green-700', label: '¡Marcador exacto! +3 pts' },
  1: { wrapper: 'bg-yellow-50 border-yellow-300', text: 'text-yellow-700', label: 'Acertaste el resultado +1 pt' },
  0: { wrapper: 'bg-red-50 border-red-200',       text: 'text-red-400',   label: 'No acertaste +0 pts' },
} as const

export default function PronosticoForm({ partido, pronostico, userId, pagoConfirmado }: Props) {
  const supabase = createClient()
  const [golesLocal, setGolesLocal] = useState<number>(pronostico?.goles_local ?? 0)
  const [golesVisitante, setGolesVisitante] = useState<number>(pronostico?.goles_visitante ?? 0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const estado = calcularEstado(partido)
  const editable = estado === 'proximo' && pagoConfirmado

  const handleSubmit = async () => {
    if (!editable) return
    setLoading(true)
    setMensaje(null)
    const { error } = await supabase
      .from('pronosticos')
      .upsert(
        { user_id: userId, partido_id: partido.id, goles_local: golesLocal, goles_visitante: golesVisitante, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,partido_id' }
      )
    setLoading(false)
    setMensaje(error ? `Error: ${error.message}` : 'Pronóstico guardado ✅')
  }

  const fechaStr = new Date(partido.fecha_partido).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

  // ── Finalizado ───────────────────────────────────────────────────────────
  if (estado === 'finalizado') {
    const pts = pronostico?.puntos_obtenidos ?? null
    const cfg = pts !== null ? PUNTOS_CONFIG[pts as 0 | 1 | 3] : null
    return (
      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500">{partido.fase}</span>
          <span className="text-xs text-gray-400">{fechaStr}</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="font-bold text-base w-28 text-right"><Bandera equipo={partido.equipo_local} /> {partido.equipo_local}</span>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{partido.goles_local} – {partido.goles_visitante}</div>
            <div className="text-xs text-gray-400 mt-0.5">resultado oficial</div>
          </div>
          <span className="font-bold text-base w-28"><Bandera equipo={partido.equipo_visitante} /> {partido.equipo_visitante}</span>
        </div>
        {pronostico ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-500">
              Tu pronóstico:{' '}
              <span className="font-semibold text-gray-700 tabular-nums">{pronostico.goles_local} – {pronostico.goles_visitante}</span>
            </p>
            {cfg && (
              <div className={`border rounded-lg px-4 py-2 text-center ${cfg.wrapper}`}>
                <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 italic">No participaste en este partido</p>
        )}
      </div>
    )
  }

  // ── Sin pago confirmado (no finalizado) ─────────────────────────────────
  if (!pagoConfirmado) {
    return (
      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">{partido.fase}</span>
          <span className="text-xs text-gray-400">{fechaStr}</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="font-bold text-lg w-32 text-right"><Bandera equipo={partido.equipo_local} /> {partido.equipo_local}</span>
          <span className="text-gray-400 font-semibold">vs</span>
          <span className="font-bold text-lg w-32"><Bandera equipo={partido.equipo_visitante} /> {partido.equipo_visitante}</span>
        </div>
        <div className="flex justify-center">
          <span className="text-sm text-yellow-800 font-medium bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            🔒 Confirma tu pago para participar y hacer pronósticos
          </span>
        </div>
      </div>
    )
  }

  // ── Próximo / Bloqueado / En vivo / Esperando resultado ──────────────────
  return (
    <div className={`border rounded-xl p-4 shadow-sm bg-white ${estado === 'en_vivo' ? 'border-red-300' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500">{partido.fase}</span>
        <span className="text-xs text-gray-400">{fechaStr}</span>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="font-bold text-lg w-32 text-right"><Bandera equipo={partido.equipo_local} /> {partido.equipo_local}</span>
        <input
          type="number" min={0} max={20} value={golesLocal} disabled={!editable}
          onChange={(e) => setGolesLocal(Number(e.target.value))}
          className="w-14 text-center border rounded-md py-1 disabled:bg-gray-100"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number" min={0} max={20} value={golesVisitante} disabled={!editable}
          onChange={(e) => setGolesVisitante(Number(e.target.value))}
          className="w-14 text-center border rounded-md py-1 disabled:bg-gray-100"
        />
        <span className="font-bold text-lg w-32"><Bandera equipo={partido.equipo_visitante} /> {partido.equipo_visitante}</span>
      </div>

      <div className="flex justify-center">
        {estado === 'proximo' && (
          <button onClick={handleSubmit} disabled={loading}
            className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar pronóstico'}
          </button>
        )}
        {estado === 'bloqueado' && (
          <span className="text-sm text-red-500 font-medium">🔒 Pronósticos cerrados</span>
        )}
        {estado === 'en_vivo' && (
          <span className="animate-pulse bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
            🔴 EN VIVO
          </span>
        )}
        {estado === 'esperando_resultado' && (
          <span className="text-sm text-gray-400 font-medium">⏳ Esperando resultado oficial</span>
        )}
      </div>

      {mensaje && <p className="text-center text-xs mt-2 text-gray-600">{mensaje}</p>}
    </div>
  )
}
