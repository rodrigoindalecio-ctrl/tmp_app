import './globals.css'
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { EventProvider } from '@/lib/event-context'
import { AdminProvider } from '@/lib/admin-context'
import Image from 'next/image'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'App RSVP | Vanessa Bidinotti',
  description: 'Gestão exclusiva de eventos e convidados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-background text-textPrimary font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <AdminProvider>
            <EventProvider>
              <header className="fixed top-0 z-50 w-full border-b border-stone-200/60 bg-white/80 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <Image
                      src="/logo_header.png"
                      alt="Logo Vanessa Bidinotti"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-arabella text-3xl leading-none text-brand tracking-tight">Vanessa Bidinotti</span>
                    <span className="font-impara text-[11px] uppercase tracking-[0.2em] text-brand mt-1">Assessoria e Cerimonial</span>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 pt-20">
              <div className="max-w-7xl mx-auto px-6 w-full py-8">
                {children}
              </div>
            </main>

            <footer className="py-8 text-center text-sm text-textSecondary/60 border-t border-borderSoft bg-surface">
              <p>© {new Date().getFullYear()} – App RSVP Vanessa Bidinotti</p>
            </footer>
            </EventProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
