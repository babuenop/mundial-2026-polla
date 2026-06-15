import { createClient } from '@/lib/supabase/server'
import UserSidebarClient from '@/app/components/UserSidebarClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  let isAuthenticated = false
  let apodo: string | null = null
  let isAdmin = false

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      isAuthenticated = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('apodo, rol')
        .eq('id', user.id)
        .single()
      apodo = profile?.apodo ?? null
      isAdmin = profile?.rol === 'admin'
    }
  } catch {
    // Token inválido o expirado — tratar como no autenticado.
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <UserSidebarClient isAuthenticated={isAuthenticated} apodo={apodo} isAdmin={isAdmin} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
