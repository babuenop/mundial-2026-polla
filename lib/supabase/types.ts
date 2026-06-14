export interface Profile {
  id: string
  nombre: string
  apodo: string
  rol: 'user' | 'admin'
  puntaje_total: number
}

export interface Partido {
  id: string
  fase: string
  equipo_local: string
  equipo_visitante: string
  fecha_partido: string
  goles_local: number | null
  goles_visitante: number | null
  finalizado: boolean
}

export interface Pronostico {
  id: string
  user_id: string
  partido_id: string
  goles_local: number
  goles_visitante: number
  puntos_obtenidos: number
}