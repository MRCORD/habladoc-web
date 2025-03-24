'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { useInitialLoad } from '@/hooks/apiHooks';
import StructuredData from '@/components/common/structured-data';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUserStore();
  useInitialLoad();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Only show landing page if not logged in
  if (user) return null;

  // The exact blue color we want to use
  const habladocBlue = 'rgb(0, 102, 204)';
  
  return (
    <div className="relative isolate px-6 pt-20 lg:px-8 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 min-h-screen">
      <StructuredData 
        name="HablaDoc - Asistente inteligente para consultas médicas"
        description="Simplifica tu práctica médica con un asistente inteligente que escucha, analiza y te ayuda a tomar las mejores decisiones."
        url="https://habladoc.ai"
        logoUrl="https://habladoc.ai/icons/logo.svg"
      />
      
      <div className="mx-auto max-w-2xl py-24 sm:py-36 lg:py-48">
        <div className="text-center space-y-6">
          {/* Hero Section with Rocket */}
          <div className="flex justify-center items-start mb-4">
            <div className="relative">
              <span className="text-5xl">🚀</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Lleva tus <span style={{ color: habladocBlue }}>consultas <br/>médicas</span> al siguiente <br/>nivel
            </h1>
          </div>
            
          {/* Subtitle */}
          <p className="mt-10 text-base sm:text-lg leading-7 text-gray-600 dark:text-gray-300 max-w-md mx-auto tracking-wide">
            Simplifica tu práctica con un asistente inteligente que escucha, 
            analiza y te ayuda a tomar las mejores decisiones médicas. 
            Optimiza el tiempo con tus pacientes y mejora los resultados 
            de cada consulta.
          </p>

          {/* Call to Action */}
          <div className="mt-10 flex flex-col items-center gap-y-4">
            <Link
              href="/api/auth/signup"
              style={{ backgroundColor: habladocBlue }}
              className="rounded-md px-6 py-3 text-sm font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-auto text-center"
            >
              Registrarse
            </Link>

            <Link
              href="/api/auth/login"
              className="text-sm font-semibold leading-6 flex items-center gap-x-1 mt-2"
            >
              <span>📚</span> <span style={{ color: habladocBlue }}>Iniciar sesión</span> <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}