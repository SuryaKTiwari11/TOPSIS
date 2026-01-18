import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TOPSIS - Multi-Criteria Decision Making',
  description: 'Advanced TOPSIS calculator for multi-criteria decision analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}