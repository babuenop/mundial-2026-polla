'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else {
      router.push('/pronosticos')
      router.refresh()
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded-xl shadow-sm">
      <h1 className="text-xl font-bold mb-4">Iniciar Sesión</h1>
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        <p className="text-xs text-center text-gray-500">
          ¿No tienes cuenta? <Link href="/registro" className="text-blue-600">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}