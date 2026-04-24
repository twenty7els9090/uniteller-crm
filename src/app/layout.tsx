import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Uniteller CRM",
  description: "Система управления лидами и партнёрами для Uniteller",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            classNames: {
              success: 'border-emerald-200/80 bg-emerald-50 text-emerald-900 shadow-card',
              error:   'border-red-200/80 bg-red-50 text-red-900 shadow-card',
              warning: 'border-amber-200/80 bg-amber-50 text-amber-900 shadow-card',
              info:    'border-sky-200/80 bg-sky-50 text-sky-900 shadow-card',
            },
          }}
        />
      </body>
    </html>
  )
}
