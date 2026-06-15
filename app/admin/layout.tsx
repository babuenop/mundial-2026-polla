import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebarLayout from './AdminSidebarLayout'

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

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>
}
