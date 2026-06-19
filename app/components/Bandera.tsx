'use client'

import { getCodigoISO } from '@/lib/banderas'

export default function Bandera({ equipo }: { equipo: string }) {
  const iso = getCodigoISO(equipo)
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={equipo}
      className="w-8 h-5 object-cover rounded-sm inline-block align-middle"
    />
  )
}
