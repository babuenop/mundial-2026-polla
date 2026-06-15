export type PronosticoConPartido = {
  partido_id: string
  goles_local: number
  goles_visitante: number
  puntos_obtenidos: number
  created_at: string
  partidos: {
    fecha_partido: string
    finalizado: boolean
  } | null
}

export type LogroEstado = {
  desbloqueado: boolean
  progreso: string
}

const VEINTICUATRO_H = 24 * 60 * 60 * 1000

export function calcularLogros(pronosticos: PronosticoConPartido[]): {
  francotirador: LogroEstado
  racha: LogroEstado
  madrugador: LogroEstado
} {
  const finalizados = pronosticos
    .filter(p => p.partidos?.finalizado)
    .sort((a, b) => a.partidos!.fecha_partido.localeCompare(b.partidos!.fecha_partido))

  // Logro 1: Francotirador — 5+ marcadores exactos
  const nExactos = finalizados.filter(p => p.puntos_obtenidos === 3).length

  // Logro 2: Racha — 3+ consecutivos con pts > 0
  let maxRacha = 0
  let rachaActual = 0
  for (const p of finalizados) {
    if (p.puntos_obtenidos > 0) {
      maxRacha = Math.max(maxRacha, ++rachaActual)
    } else {
      rachaActual = 0
    }
  }

  // Logro 3: Madrugador — todos con 24h+ de anticipación, mínimo 5
  const total = pronosticos.length
  let sinAnticipacion = 0
  for (const p of pronosticos) {
    if (!p.partidos?.fecha_partido) continue
    const anticipacion = new Date(p.partidos.fecha_partido).getTime() - new Date(p.created_at).getTime()
    if (anticipacion < VEINTICUATRO_H) sinAnticipacion++
  }

  return {
    francotirador: {
      desbloqueado: nExactos >= 5,
      progreso: nExactos >= 5
        ? `${nExactos} marcadores exactos acertados`
        : `Llevas ${nExactos} de 5 marcadores exactos`,
    },
    racha: {
      desbloqueado: maxRacha >= 3,
      progreso: maxRacha >= 3
        ? `Racha máxima de ${maxRacha} partidos consecutivos`
        : `Mejor racha: ${maxRacha} de 3 partidos consecutivos`,
    },
    madrugador: {
      desbloqueado: total >= 5 && sinAnticipacion === 0,
      progreso: total < 5
        ? `Necesitás ${5 - total} pronóstico${5 - total !== 1 ? 's' : ''} más para calificar`
        : sinAnticipacion === 0
          ? `${total} pronósticos realizados con 24h+ de anticipación`
          : `${sinAnticipacion} pronóstico${sinAnticipacion !== 1 ? 's' : ''} hecho${sinAnticipacion !== 1 ? 's' : ''} con menos de 24h`,
    },
  }
}
