'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

interface UserSidebarClientProps {
  isAuthenticated: boolean
  apodo: string | null
  isAdmin: boolean
}

const APP_LINKS = [
  { href: '/pronosticos',       label: 'Pronósticos' },
  { href: '/tabla-posiciones',  label: 'Tabla de Posiciones' },
  { href: '/pronosticos-todos', label: 'Comunidad' },
  { href: '/perfil',            label: 'Mi Perfil' },
  { href: '/reglas',            label: 'Reglas' },
]

export default function UserSidebarClient({ isAuthenticated, apodo, isAdmin }: UserSidebarClientProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const close = () => setMenuOpen(false)

  const linkClass = (href: string) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(href + '/')
        ? 'bg-gray-800 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-900'
    }`

  // JSX variable — NOT a component, avoids re-mount on every render
  const navContent = isAuthenticated ? (
    <div className="space-y-0.5">
      {APP_LINKS.map((link) => (
        <Link key={link.href} href={link.href} onClick={close} className={linkClass(link.href)}>
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin/partidos"
          onClick={close}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-purple-400 hover:text-purple-200 hover:bg-purple-900/30"
        >
          Panel Admin
          <span className="bg-purple-700 text-purple-100 text-xs px-1.5 py-0.5 rounded font-semibold">★</span>
        </Link>
      )}
      <div className="pt-3 mt-1 border-t border-gray-800 px-3">
        <LogoutButton />
      </div>
    </div>
  ) : (
    <div className="space-y-0.5">
      <Link href="/reglas" onClick={close} className={linkClass('/reglas')}>
        Reglas
      </Link>
      <Link href="/login" onClick={close} className={linkClass('/login')}>
        Iniciar sesión
      </Link>
      <Link
        href="/registro"
        onClick={close}
        className="block px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        Registrarse
      </Link>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-gray-950 text-white sticky top-0 h-screen overflow-y-auto p-4">
        <Link href="/" className="block font-bold text-white text-base tracking-tight mb-5">
          Mundial 2026
        </Link>
        {isAuthenticated && (
          <p className="px-3 text-xs text-gray-500 mb-2">
            Hola, <span className="text-gray-300 font-medium">{apodo}</span>
          </p>
        )}
        {navContent}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="bg-gray-950 text-white px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-white" onClick={close}>
            Mundial 2026
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-white text-2xl leading-none px-1"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="bg-gray-950 text-white px-4 pb-4">
            {isAuthenticated && (
              <p className="px-3 py-2 text-xs text-gray-500">
                Hola, <span className="text-gray-300 font-medium">{apodo}</span>
              </p>
            )}
            {navContent}
          </div>
        )}
      </div>
    </>
  )
}
