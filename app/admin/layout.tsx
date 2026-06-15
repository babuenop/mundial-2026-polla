import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') redirect('/')

  return (
    <div>
      <nav className="bg-gray-900 text-white px-6 py-3 flex gap-6 items-center">
        <span className="font-bold">Admin</span>
        <Link href="/admin/partidos" className="hover:underline">
          Partidos
        </Link>
        <Link href="/admin/resultados" className="hover:underline">
          Resultados
        </Link>
        <Link href="/admin/jugadores" className="hover:underline">
          Jugadores
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto p-6">{children}</main>
    </div>
  )
}
