'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegistroPage() {
  const supabase = createClient()
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [apodo, setApodo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, apodo } },
    })
    setLoading(false)
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('over_email_send_rate_limit') || msg.includes('email rate limit')) {
        setError('Se alcanzó el límite de registros, intenta de nuevo en unos minutos.')
      } else {
        setError(error.message)
      }
      return
    }
    if (data.session) {
      router.push('/pronosticos')
      router.refresh()
    } else {
      setError('Revisá tu correo para confirmar tu cuenta antes de ingresar.')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded-xl shadow-sm">
      <h1 className="text-xl font-bold mb-4">Crear Cuenta</h1>
      <div className="space-y-3">
        <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Apodo (público)" value={apodo} onChange={(e) => setApodo(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="button" onClick={handleRegister} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creando...' : 'Registrarse'}
        </button>
        <p className="text-xs text-center text-gray-500">
          ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600">Inicia sesión</Link>
        </p>
        <p className="text-xs text-center text-gray-400 border-t pt-3">
          El registro es libre. Para participar en los pronósticos, confirmá tu pago con el administrador después de crear tu cuenta.
        </p>
      </div>
    </div>
  )
}