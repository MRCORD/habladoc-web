// app/layout.tsx
import { AuthProvider } from '@/components/auth/auth-provider';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0066cc',
};

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000'
  ),
  title: 'HablaDoc | Asistente inteligente para consultas médicas',
  description: 'Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones para tus pacientes.',
  keywords: 'consultas médicas, asistente médico, español, doctores hispanohablantes, telemedicina, salud digital',
  robots: 'index, follow',
  canonical: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  authors: [{ name: 'HablaDoc Team' }],
  creator: 'HablaDoc',
  publisher: 'HablaDoc',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
    title: 'HablaDoc | Asistente inteligente para consultas médicas',
    description: 'Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones.',
    siteName: 'HablaDoc',
    images: [
      {
        url: '/icons/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'HablaDoc - Asistente médico inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HablaDoc | Asistente inteligente para consultas médicas',
    description: 'Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones.',
    images: ['/icons/og-image.svg'],
    creator: '@habladoc',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/logo.svg',
        color: '#0066cc',
      },
    ],
  },
  manifest: '/site.webmanifest',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Header />
              <main>{children}</main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}