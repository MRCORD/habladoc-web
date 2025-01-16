// app/layout.tsx
import { AuthProvider } from '@/components/auth/auth-provider';
import { Header } from '@/components/layout/header';
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
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <Header />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}