'use client'

import { useState } from 'react'
import { togglePago } from './actions'

interface Props {
  userId: string
  pago: boolean
}

export default function PagoToggle({ userId, pago: initialPago }: Props) {
  const [pago, setPago]       = useState(initialPago)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    setError(null)
    const nuevo = !pago
    const result = await togglePago(userId, nuevo)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setPago(nuevo)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50 ${
          pago
            ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
            : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
        }`}
      >
        {loading ? '…' : pago ? '✅ Pagado' : '❌ Pendiente'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
