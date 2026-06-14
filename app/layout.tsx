import './globals.css'
import Navbar from './components/Navbar'

export const metadata = {
  title: 'Polla Mundial 2026',
  description: 'Pronósticos del Mundial 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  )
}