import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let apodo: string | null = null
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('apodo, rol')
      .eq('id', user.id)
      .single()

    apodo = profile?.apodo ?? null
    isAdmin = profile?.rol === 'admin'
  }

  return (
    <nav className="bg-gray-950 text-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold tracking-tight text-white">
        Mundial 2026
      </Link>

      <div className="flex items-center gap-5 text-sm">
        {!user ? (
          <>
            <Link href="/login" className="hover:text-gray-300 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              Registrarse
            </Link>
          </>
        ) : (
          <>
            <span className="text-gray-400 text-xs">
              Hola, <span className="text-white font-medium">{apodo}</span>
            </span>
            <Link href="/pronosticos" className="hover:text-gray-300 transition-colors">
              Pronósticos
            </Link>
            <Link href="/tabla-posiciones" className="hover:text-gray-300 transition-colors">
              Tabla
            </Link>
            <Link href="/pronosticos-todos" className="hover:text-gray-300 transition-colors">
              Comunidad
            </Link>

            {/* Admin link: only rendered server-side when rol='admin' — never in HTML for other users */}
            {isAdmin && (
              <Link
                href="/admin/partidos"
                className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Admin
                <span className="bg-purple-700 text-purple-100 text-xs px-1.5 py-0.5 rounded font-semibold tracking-wide">
                  ★
                </span>
              </Link>
            )}

            <LogoutButton />
          </>
        )}
      </div>
    </nav>
  )
}
