'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PartidoForm() {
  const supabase = createClient()
  const router = useRouter()

  const [fase, setFase] = useState('')
  const [equipoLocal, setEquipoLocal] = useState('')
  const [equipoVisitante, setEquipoVisitante] = useState('')
  const [fechaPartido, setFechaPartido] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!fase || !equipoLocal || !equipoVisitante || !fechaPartido) {
      setMensaje('Completá todos los campos.')
      return
    }

    setLoading(true)
    setMensaje(null)

    const { error } = await supabase.from('partidos').insert({
      fase,
      equipo_local: equipoLocal,
      equipo_visitante: equipoVisitante,
      fecha_partido: new Date(fechaPartido).toISOString(),
    })

    setLoading(false)

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setMensaje('Partido creado exitosamente.')
      setFase('')
      setEquipoLocal('')
      setEquipoVisitante('')
      setFechaPartido('')
      router.refresh()
    }
  }

  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm max-w-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Fase</label>
          <input
            type="text"
            placeholder="Ej: Grupo A, Octavos, Final…"
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Equipo local</label>
          <input
            type="text"
            placeholder="Argentina"
            value={equipoLocal}
            onChange={(e) => setEquipoLocal(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Equipo visitante</label>
          <input
            type="text"
            placeholder="Brasil"
            value={equipoVisitante}
            onChange={(e) => setEquipoVisitante(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha y hora</label>
          <input
            type="datetime-local"
            value={fechaPartido}
            onChange={(e) => setFechaPartido(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {mensaje && (
        <p className={`text-xs ${mensaje.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {mensaje}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Crear partido'}
      </button>
    </div>
  )
}
