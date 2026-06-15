'use client'

import { useState } from 'react'
import { deleteUser } from './actions'

interface Props {
  userId: string
  apodo: string
  isCurrentUser: boolean
}

export default function EliminarUsuario({ userId, apodo, isCurrentUser }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a "${apodo}"? Se borrarán su cuenta y todos sus pronósticos. Esta acción no se puede deshacer.`)) return
    setLoading(true)
    setError(null)
    const result = await deleteUser(userId)
    setLoading(false)
    if (result.error) setError(result.error)
    // Si no hay error, revalidatePath ya refrescó la lista desde el server
  }

  if (isCurrentUser) {
    return (
      <button disabled title="No podés eliminarte a vos mismo"
        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 text-gray-300 cursor-not-allowed">
        Eliminar
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1.5 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Eliminando…' : 'Eliminar'}
      </button>
      {error && <p className="text-xs text-red-500 max-w-32 text-right">{error}</p>}
    </div>
  )
}
