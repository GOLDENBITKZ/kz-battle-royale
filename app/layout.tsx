import type { Metadata, Viewport } from 'next'
import './globals.css'
import SWRegister from '@/components/SWRegister'

export const metadata: Metadata = {
  title: 'ҚАЗАҚСТАН Battle Royale',
  description: 'Великий Клик — битва за Казахстан',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KZ Battle',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0F',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-dark text-white antialiased">
        {children}
        <SWRegister />
      </body>
    </html>
  )
}
