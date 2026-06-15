'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const ADMIN_LINKS = [
  { href: '/admin/partidos', label: 'Partidos' },
  { href: '/admin/resultados', label: 'Resultados' },
  { href: '/admin/jugadores', label: 'Jugadores' },
  { href: '/admin/pronosticos', label: 'Pronósticos' },
]

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = (href: string) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-purple-700 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-gray-900 text-white p-4 space-y-1">
        <div className="font-bold text-base mb-4 text-purple-300 tracking-tight">⚙ Admin</div>
        {ADMIN_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass(link.href)}>
            {link.label}
          </Link>
        ))}
        <div className="pt-3 mt-2 border-t border-gray-700">
          <Link
            href="/pronosticos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ← Mi cuenta
          </Link>
        </div>
      </aside>

      {/* Mobile header + dropdown */}
      <div className="md:hidden">
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-purple-300">⚙ Admin</span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-white text-2xl leading-none px-1"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="bg-gray-900 text-white px-4 pb-4 space-y-1">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-gray-700">
              <Link
                href="/pronosticos"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                ← Mi cuenta
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
