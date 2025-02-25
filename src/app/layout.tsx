// app/layout.tsx
import { AuthProvider } from '@/components/auth/auth-provider';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

export const metadata = {
  title: 'HablaDoc',
  description: 'Connect with Spanish-speaking doctors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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