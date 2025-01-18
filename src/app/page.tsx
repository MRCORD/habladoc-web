// app/page.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Only show landing page if not logged in
  if (user) return null;

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Make your medical consultations more effective
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Record, transcribe, and analyze your medical consultations to provide better care for your Spanish-speaking patients.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/api/auth/login"
              className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Join as a doctor
            </a>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}