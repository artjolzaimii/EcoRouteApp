import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoRoute Partner Portal',
  description: 'Manage your EcoRoute marketplace listings',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
