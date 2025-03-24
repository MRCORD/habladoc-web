// app/layout.tsx
import { AuthProvider } from '@/components/auth/auth-provider';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

export const metadata = {
  title: 'HablaDoc | Asistente inteligente para consultas médicas',
  description: 'Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones para tus pacientes.',
  keywords: 'consultas médicas, asistente médico, español, doctores hispanohablantes, telemedicina, salud digital',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  canonical: 'https://habladoc.com', // Update with your domain
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
    url: 'https://habladoc.com', // Update with your domain
    title: 'HablaDoc | Asistente inteligente para consultas médicas',
    description: 'Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones.',
    siteName: 'HablaDoc',
    images: [
      {
        url: '/icons/og-image.png', // We'll create this
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
    images: ['/icons/og-image.png'], // We'll create this
    creator: '@habladoc', // Update with your Twitter handle
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#0066cc', // Using HablaDoc blue
      },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#0066cc', // HablaDoc blue
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