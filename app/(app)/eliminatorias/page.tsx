import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Partido } from '@/lib/types'
import BracketView from './BracketView'

export default async function EliminatoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: partidos }] = await Promise.all([
    supabase.from('profiles').select('rol').eq('id', user.id).single(),
    supabase
      .from('partidos')
      .select('*')
      .in('fase', ['Dieciseisavos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Final'])
      .order('bracket_slot', { ascending: true }),
  ])

  const isAdmin = profile?.rol === 'admin'

  return (
    <BracketView
      partidos={(partidos ?? []) as Partido[]}
      isAdmin={isAdmin}
    />
  )
}
