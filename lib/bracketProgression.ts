// Bracket slot progression for the 2026 World Cup elimination rounds.
// Each slot maps to the next round's slot and which side (local/visitante) the winner occupies.

type Siguiente = { slot: string; posicion: 'local' | 'visitante' }

export const SIGUIENTE_SLOT: Record<string, Siguiente> = {
  // Dieciseisavos → Octavos
  'D-1':  { slot: 'O-1', posicion: 'local' },
  'D-2':  { slot: 'O-1', posicion: 'visitante' },
  'D-3':  { slot: 'O-2', posicion: 'local' },
  'D-4':  { slot: 'O-2', posicion: 'visitante' },
  'D-5':  { slot: 'O-3', posicion: 'local' },
  'D-6':  { slot: 'O-3', posicion: 'visitante' },
  'D-7':  { slot: 'O-4', posicion: 'local' },
  'D-8':  { slot: 'O-4', posicion: 'visitante' },
  'D-9':  { slot: 'O-5', posicion: 'local' },
  'D-10': { slot: 'O-5', posicion: 'visitante' },
  'D-11': { slot: 'O-6', posicion: 'local' },
  'D-12': { slot: 'O-6', posicion: 'visitante' },
  'D-13': { slot: 'O-7', posicion: 'local' },
  'D-14': { slot: 'O-7', posicion: 'visitante' },
  'D-15': { slot: 'O-8', posicion: 'local' },
  'D-16': { slot: 'O-8', posicion: 'visitante' },
  // Octavos → Cuartos
  'O-1':  { slot: 'C-1', posicion: 'local' },
  'O-2':  { slot: 'C-1', posicion: 'visitante' },
  'O-3':  { slot: 'C-2', posicion: 'local' },
  'O-4':  { slot: 'C-2', posicion: 'visitante' },
  'O-5':  { slot: 'C-3', posicion: 'local' },
  'O-6':  { slot: 'C-3', posicion: 'visitante' },
  'O-7':  { slot: 'C-4', posicion: 'local' },
  'O-8':  { slot: 'C-4', posicion: 'visitante' },
  // Cuartos → Semifinales
  'C-1':  { slot: 'S-1', posicion: 'local' },
  'C-2':  { slot: 'S-1', posicion: 'visitante' },
  'C-3':  { slot: 'S-2', posicion: 'local' },
  'C-4':  { slot: 'S-2', posicion: 'visitante' },
  // Semifinales → Final
  'S-1':  { slot: 'F-1', posicion: 'local' },
  'S-2':  { slot: 'F-1', posicion: 'visitante' },
}

export function calcularGanador(
  equipoLocal: string,
  equipoVisitante: string,
  golesLocal: number,
  golesVisitante: number,
  penalesLocal: number | null | undefined,
  penalesVisitante: number | null | undefined,
): string | null {
  if (golesLocal > golesVisitante) return equipoLocal
  if (golesVisitante > golesLocal) return equipoVisitante
  // Empate en tiempo regular → definido por penales
  if (penalesLocal != null && penalesVisitante != null) {
    if (penalesLocal > penalesVisitante) return equipoLocal
    if (penalesVisitante > penalesLocal) return equipoVisitante
  }
  return null // resultado incompleto o inválido
}
