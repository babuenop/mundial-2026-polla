import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import PagoToggle from './PagoToggle'
import EliminarUsuario from './EliminarUsuario'

type ProfileFila = {
  id: string
  apodo: string
  nombre: string
  puntaje_total: number
  pago_confirmado: boolean
  rol: string
}

export default async function AdminJugadoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, apodo, nombre, puntaje_total, pago_confirmado, rol')
      .order('apodo', { ascending: true }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Map email por id desde auth.users
  const emailMap = new Map<string, string>()
  for (const u of authData?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email)
  }

  const lista = (profiles as ProfileFila[] | null) ?? []
  const pagados   = lista.filter(p => p.pago_confirmado).length
  const pendientes = lista.length - pagados

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">Jugadores</h1>
        <p className="text-sm text-gray-500">
          <span className="text-green-600 font-medium">{pagados} pagados</span>
          {' · '}
          <span className="text-red-500 font-medium">{pendientes} pendientes</span>
        </p>
      </div>

      {lista.length === 0 && (
        <p className="text-sm text-gray-500">No hay jugadores registrados.</p>
      )}

      <div className="space-y-3">
        {lista.map((p) => (
          <div
            key={p.id}
            className={`border rounded-xl px-4 py-3 bg-white shadow-sm flex items-center justify-between gap-4 flex-wrap ${
              p.pago_confirmado ? '' : 'border-red-100'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{p.apodo}</p>
                {p.rol === 'admin' && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-semibold">
                    admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{p.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {emailMap.get(p.id) ?? <span className="italic">sin email</span>}
                {' · '}
                {p.puntaje_total} pts
              </p>
            </div>

            <div className="flex items-center gap-3">
              <PagoToggle userId={p.id} pago={p.pago_confirmado} />
              <EliminarUsuario
                userId={p.id}
                apodo={p.apodo}
                isCurrentUser={p.id === user?.id}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
