import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, Instrument_Serif } from 'next/font/google'
import { PreferencesProvider } from '@/lib/hooks/usePreferences'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Firm OS Command Center',
  description: 'Enterprise command center for design studios',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${cormorant.variable} ${instrumentSerif.variable}`}
        suppressHydrationWarning
      >
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  )
}
