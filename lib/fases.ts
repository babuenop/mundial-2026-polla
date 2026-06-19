export const FASES_ORDEN = [
  'Fase de Grupos',
  'Dieciseisavos de Final',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinales',
  'Tercer Puesto',
  'Final',
] as const

export type FaseCategoria = (typeof FASES_ORDEN)[number]

export function normalizarFase(fase: string): FaseCategoria {
  if (fase.startsWith('Group')) return 'Fase de Grupos'
  if ((FASES_ORDEN as readonly string[]).includes(fase)) return fase as FaseCategoria
  return 'Fase de Grupos'
}

export function esFaseGrupos(categoria: FaseCategoria): boolean {
  return categoria === 'Fase de Grupos'
}

/** Validates a string from searchParams against known fase categories */
export function parseFaseParam(param: string | undefined): FaseCategoria | null {
  if (!param) return null
  if ((FASES_ORDEN as readonly string[]).includes(param)) return param as FaseCategoria
  return null
}
