import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function formatearFechaPanama(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    timeZone: 'America/Panama',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function HomePage() {
  const supabase = await createClient()

  // Redirigir usuarios ya autenticados directamente a sus pronósticos
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (user) redirect('/pronosticos')

  const now        = new Date()
  const nowISO     = now.toISOString()
  const vivoDesde  = new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString()

  const [
    { count: jugadores },
    { count: finalizados },
    { count: totalPartidos },
    { data: enVivoData },
    { data: proximoData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('pago_confirmado', true),
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('finalizado', true),
    supabase.from('partidos').select('*', { count: 'exact', head: true }),
    supabase.from('partidos')
      .select('equipo_local, equipo_visitante, fecha_partido')
      .lte('fecha_partido', nowISO)
      .gte('fecha_partido', vivoDesde)
      .eq('finalizado', false)
      .order('fecha_partido', { ascending: true })
      .limit(1),
    supabase.from('partidos')
      .select('equipo_local, equipo_visitante, fecha_partido')
      .gt('fecha_partido', nowISO)
      .order('fecha_partido', { ascending: true })
      .limit(1),
  ])

  const enVivo = enVivoData?.[0] ?? null
  const proximo = proximoData?.[0] ?? null

  return (
    <div className="min-h-screen flex flex-col">
    {/* Header público */}
    <header className="bg-gray-950 text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold tracking-tight">Mundial 2026</span>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/reglas" className="text-gray-300 hover:text-white transition-colors">
          Reglas
        </Link>
        <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          Registrarse
        </Link>
      </div>
    </header>

    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10 w-full">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">⚽ Polla Mundial 2026</h1>
        <p className="text-gray-500 text-lg">
          Pronosticá todos los partidos y competí con tus amigos.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Jugadores */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">👥</span>
          <p className="text-5xl font-bold text-gray-900">{jugadores ?? 0}</p>
          <p className="text-sm text-gray-500 font-medium">jugadores participando</p>
        </div>

        {/* Partidos jugados */}
        <div className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">⚽</span>
          <p className="text-5xl font-bold text-gray-900">
            {finalizados ?? 0}
            <span className="text-2xl font-normal text-gray-400"> / {totalPartidos ?? 0}</span>
          </p>
          <p className="text-sm text-gray-500 font-medium">partidos jugados</p>
        </div>

        {/* EN VIVO o Próximo partido */}
        {enVivo ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
            <span className="animate-pulse inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              🔴 EN VIVO
            </span>
            <p className="font-bold text-gray-900 text-base mt-1">
              {enVivo.equipo_local}
            </p>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">vs</p>
            <p className="font-bold text-gray-900 text-base">
              {enVivo.equipo_visitante}
            </p>
          </div>
        ) : proximo ? (
          <div className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">⏭️</span>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Próximo partido</p>
            <p className="font-bold text-gray-900 text-sm">
              {proximo.equipo_local} <span className="font-normal text-gray-400">vs</span> {proximo.equipo_visitante}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {formatearFechaPanama(proximo.fecha_partido)}
            </p>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🏆</span>
            <p className="text-sm text-gray-500 font-medium">Torneo finalizado</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/login"
          className="w-full sm:w-auto text-center border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="w-full sm:w-auto text-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Registrarse
        </Link>
      </div>

      <p className="text-center text-sm text-gray-400">
        El registro es libre, pero para participar en los pronósticos debés confirmar tu pago con el administrador.
      </p>

    </div>
    </div>
  )
}
