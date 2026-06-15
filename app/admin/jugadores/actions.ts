'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  // Verificar que el llamador es admin (server-side, no confiar en el cliente)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (callerProfile?.rol !== 'admin') return { error: 'No autorizado' }
  if (userId === user.id) return { error: 'No podés eliminarte a vos mismo' }

  // Usar service role (bypasa RLS) para limpiar datos públicos antes de
  // borrar auth.users, evitando depender del cascade en el esquema auth
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Borrar pronósticos del usuario
  const { error: errPron } = await adminClient
    .from('pronosticos')
    .delete()
    .eq('user_id', userId)
  if (errPron) return { error: errPron.message }

  // 2. Borrar perfil
  const { error: errProfile } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (errProfile) return { error: errProfile.message }

  // 3. Borrar usuario de auth (sin datos públicos que bloqueen)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/jugadores')
  return { error: null }
}

export async function togglePago(userId: string, pago: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (callerProfile?.rol !== 'admin') return { error: 'No autorizado' }

  const { error } = await supabase
    .from('profiles')
    .update({ pago_confirmado: pago })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/jugadores')
  return { error: null }
}
