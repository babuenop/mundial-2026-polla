'use client'

import { useRouter } from 'next/navigation'
import type { FaseCategoria } from '@/lib/fases'

interface Props {
  fasesDisponibles: FaseCategoria[]
  faseActiva: FaseCategoria
  basePath: string
  /** Preserved in URL when navigating back to Fase de Grupos */
  fechaActual?: string
}

export default function FaseFilter({ fasesDisponibles, faseActiva, basePath, fechaActual }: Props) {
  const router = useRouter()

  const navToFase = (fase: FaseCategoria) => {
    const params = new URLSearchParams({ fase })
    if (fase === 'Fase de Grupos' && fechaActual) params.set('fecha', fechaActual)
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {fasesDisponibles.map(fase => (
        <button
          key={fase}
          onClick={() => navToFase(fase)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
            fase === faseActiva
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-700'
          }`}
        >
          {fase}
        </button>
      ))}
    </div>
  )
}
