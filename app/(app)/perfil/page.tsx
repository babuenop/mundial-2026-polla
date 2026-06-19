import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcularLogros, type PronosticoConPartido, type LogroEstado } from '@/lib/logros'
import Bandera from '@/app/components/Bandera'

const LOGROS_META = [
  {
    key: 'francotirador' as const,
    emoji: '🎯',
    nombre: 'Francotirador',
    descripcion: 'Acertá 5 o más marcadores exactos',
  },
  {
    key: 'racha' as const,
    emoji: '🔥',
    nombre: 'Racha',
    descripcion: '3 o más pronósticos consecutivos acertando al menos el resultado',
  },
  {
    key: 'madrugador' as const,
    emoji: '🌟',
    nombre: 'Madrugador',
    descripcion: 'Hacé todos tus pronósticos con 24h+ de anticipación (mínimo 5)',
  },
]

function LogroCard({ meta, estado }: { meta: typeof LOGROS_META[number]; estado: LogroEstado }) {
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-2 ${
      estado.desbloqueado
        ? 'bg-yellow-50 border-yellow-300'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-3xl ${estado.desbloqueado ? '' : 'grayscale opacity-40'}`}>
          {meta.emoji}
        </span>
        <div>
          <p className={`font-semibold text-sm ${estado.desbloqueado ? 'text-yellow-900' : 'text-gray-400'}`}>
            {meta.nombre}
          </p>
          <p className={`text-xs ${estado.desbloqueado ? 'text-yellow-700' : 'text-gray-400'}`}>
            {meta.descripcion}
          </p>
        </div>
      </div>
      <p className={`text-xs font-medium border-t pt-2 ${
        estado.desbloqueado ? 'text-yellow-700 border-yellow-200' : 'text-gray-400 border-gray-200'
      }`}>
        {estado.desbloqueado ? '✓ ' : ''}{estado.progreso}
      </p>
    </div>
  )
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: pronosticosRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre, apodo, puntaje_total, nacionalidad')
      .eq('id', user.id)
      .single(),
    supabase
      .from('pronosticos')
      .select('partido_id, goles_local, goles_visitante, puntos_obtenidos, created_at, partidos(fecha_partido, finalizado)')
      .eq('user_id', user.id),
  ])

  const pronosticos = (pronosticosRaw as PronosticoConPartido[] | null) ?? []
  const logros = calcularLogros(pronosticos)

  const finalizados = pronosticos.filter(p => p.partidos?.finalizado)
  const nTotal      = pronosticos.length
  const nFin        = finalizados.length
  const nExactos    = finalizados.filter(p => p.puntos_obtenidos === 3).length
  const nResultado  = finalizados.filter(p => p.puntos_obtenidos === 1).length
  const nFallidos   = finalizados.filter(p => p.puntos_obtenidos === 0).length
  const pctExactos  = nFin > 0 ? Math.round(nExactos  / nFin * 100) : 0
  const pctResultado = nFin > 0 ? Math.round(nResultado / nFin * 100) : 0

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      {/* Datos del usuario */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center gap-2">
          {profile?.nacionalidad && <Bandera equipo={profile.nacionalidad} />}
          <p className="text-2xl font-bold">{profile?.apodo}</p>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{profile?.nombre}</p>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-gray-900">{profile?.puntaje_total ?? 0}</span>
          <span className="text-lg text-gray-400">puntos totales</span>
        </div>
      </div>

      {/* Estadísticas */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-gray-700">Estadísticas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{nTotal}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pronósticos</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{nExactos}</p>
            <p className="text-xs text-gray-500 mt-0.5">Exactos ({pctExactos}%)</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{nResultado}</p>
            <p className="text-xs text-gray-500 mt-0.5">Resultado ({pctResultado}%)</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{nFallidos}</p>
            <p className="text-xs text-gray-500 mt-0.5">Fallidos</p>
          </div>
        </div>
      </div>

      {/* Logros */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-gray-700">Logros</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LOGROS_META.map(meta => (
            <LogroCard key={meta.key} meta={meta} estado={logros[meta.key]} />
          ))}
        </div>
      </div>
    </div>
  )
}
