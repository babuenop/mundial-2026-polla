'use client'

import { useState } from 'react'
import Bandera from '@/app/components/Bandera'
import { getCodigoISO, EQUIPOS_VALIDOS } from '@/lib/banderas'
import { actualizarNacionalidad } from './actions'

interface Props {
  userId: string
  nacionalidad: string | null
}

export default function NacionalidadEditor({ userId, nacionalidad: inicial }: Props) {
  const [valor, setValor] = useState(inicial ?? '')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const esValida = valor !== '' && getCodigoISO(valor) !== 'un'

  const handleGuardar = async () => {
    setLoading(true)
    setMensaje(null)
    const result = await actualizarNacionalidad(userId, valor)
    setLoading(false)
    setMensaje(result.error ?? '✅ Guardado')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <div className="flex items-center gap-1.5">
        {esValida ? (
          <Bandera equipo={valor} />
        ) : (
          <span className="w-8 h-5 bg-gray-100 border rounded-sm inline-block" />
        )}
        <input
          list={`paises-${userId}`}
          value={valor}
          onChange={e => { setValor(e.target.value); setMensaje(null) }}
          placeholder="Nacionalidad…"
          className="border rounded px-2 py-1 text-xs w-40"
        />
        <datalist id={`paises-${userId}`}>
          {EQUIPOS_VALIDOS.map(p => <option key={p} value={p} />)}
        </datalist>
      </div>
      <button
        onClick={handleGuardar}
        disabled={loading}
        className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
      >
        {loading ? '…' : 'Guardar'}
      </button>
      {mensaje && (
        <span className={`text-xs ${mensaje.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {mensaje}
        </span>
      )}
    </div>
  )
}
