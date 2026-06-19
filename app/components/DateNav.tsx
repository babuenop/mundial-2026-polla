'use client'

import { useRouter } from 'next/navigation'

interface Props {
  fechaActual: string // "YYYY-MM-DD" en hora Panama
  hoy: string        // "YYYY-MM-DD" de hoy según el servidor
  basePath: string   // ruta base, e.g. "/pronosticos" o "/pronosticos-todos"
  extraParams?: Record<string, string> // params adicionales a preservar en la URL (e.g. { fase: 'Fase de Grupos' })
}

function desplazar(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export default function DateNav({ fechaActual, hoy, basePath, extraParams }: Props) {
  const router = useRouter()
  const nav = (f: string) => {
    const params = new URLSearchParams({ ...extraParams, fecha: f })
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => nav(desplazar(fechaActual, -1))}
        className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition-colors"
      >
        ← Ayer
      </button>
      <input
        type="date"
        value={fechaActual}
        onChange={(e) => e.target.value && nav(e.target.value)}
        className="border rounded-md px-3 py-1.5 text-sm"
      />
      <button
        onClick={() => nav(desplazar(fechaActual, 1))}
        className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 transition-colors"
      >
        Mañana →
      </button>
      {fechaActual !== hoy && (
        <button
          onClick={() => nav(hoy)}
          className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Hoy
        </button>
      )}
    </div>
  )
}
