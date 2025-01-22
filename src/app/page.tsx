// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { useInitialLoad } from '@/hooks/apiHooks';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUserStore();
  const { isLoading: isInitialLoading } = useInitialLoad();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isInitialLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Only show landing page if not logged in
  if (user) return null;

  return (
    <div className="relative isolate px-6 pt-20 lg:px-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="mx-auto max-w-2xl py-24 sm:py-36 lg:py-48">
        <div className="text-center space-y-6">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Call to Action */}
          <CallToAction />
        </div>
      </div>
    </div>
  );
}

// Split into components for better organization
function HeroSection() {
  return (
    <>
      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
        🚀 Lleva tus{' '}
        <span className="text-primary">consultas médicas</span>{' '}
        al siguiente nivel
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-base sm:text-lg leading-7 text-gray-600 max-w-md mx-auto tracking-wide">
        Simplifica tu práctica con un asistente inteligente que escucha, 
        analiza y te ayuda a tomar las mejores decisiones médicas. 
        Optimiza el tiempo con tus pacientes y mejora los resultados 
        de cada consulta.
      </p>
    </>
  );
}

function CallToAction() {
  return (
    <div className="mt-8 flex flex-col items-center gap-y-4">
      <AuthButton />
      <LearnMoreLink />
    </div>
  );
}

function AuthButton() {
  return (
    <a
      href="/api/auth/login"
      className={`
        rounded-md bg-primary px-6 py-3 text-sm font-semibold 
        text-white shadow-lg hover:bg-primary/90 
        focus-visible:outline focus-visible:outline-2 
        focus-visible:outline-offset-2 focus-visible:outline-primary 
        w-full sm:w-auto text-center transition-colors
        transform hover:scale-105 duration-200
      `}
    >
      Únete como doctor
    </a>
  );
}

function LearnMoreLink() {
  return (
    <Link
      href="/about"
      className="
        text-sm font-semibold leading-6 text-gray-900 
        hover:underline transition-all duration-200
        flex items-center gap-x-1
      "
    >
      📚 Aprende más 
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}