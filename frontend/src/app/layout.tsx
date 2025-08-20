import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ToastProviderWrapper } from '@/components/providers/toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SynapEvents - Host & Join Hackathons',
  description: 'A modern platform for hosting and participating in hackathons and tech events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <ToastProviderWrapper>
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </ToastProviderWrapper>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
