import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PETIR – Persaudaraan Timur Raya',
  description: 'Sistem Kartu Tanda Anggota PETIR Persaudaraan Timur Raya',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
