import type { Metadata } from 'next'
import { PreferencesProvider } from '@/lib/hooks/usePreferences'
import './globals.css'

export const metadata: Metadata = {
  title: 'Firm OS Command Center',
  description: 'Enterprise command center for design studios',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  )
}
