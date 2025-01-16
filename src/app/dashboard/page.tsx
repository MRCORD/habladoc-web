// app/dashboard/page.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOrCreateUser } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import Link from 'next/link';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { User } from '@/types';
import UserEditDrawer from '@/components/dashboard/user-edit-drawer';

export default function Dashboard() {
  const { user: auth0User, isLoading: isUserLoading } = useUser();
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verifyUser() {
      if (!auth0User) return;
      
      try {
        console.log('🔄 Starting user verification...', {
          auth0User: {
            sub: auth0User.sub,
            email: auth0User.email
          }
        });
        
        setIsLoading(true);
        const userData = await verifyOrCreateUser();
        
        console.log('✅ User verification completed:', userData);
        
        if (userData.success) {
          setServerUser(userData.data);
          
          if (userData.is_new && userData.data.roles.includes('doctor')) {
            console.log('🔄 Redirecting new doctor to complete profile');
            router.push('/dashboard/complete-profile');
          }
        } else {
          console.warn('⚠️ User verification failed:', userData.message);
          setError(userData.message || 'Failed to verify user');
        }
      } catch (err) {
        console.error('❌ Error in user verification:', err);
        setError('Failed to verify user status');
      } finally {
        setIsLoading(false);
      }
    }

    if (auth0User && !isUserLoading) {
      console.log('🔄 Auth0 user loaded, starting verification');
      verifyUser();
    }
  }, [auth0User, isUserLoading, router]);

  if (isUserLoading || isLoading) {
    console.log('⏳ Loading dashboard...');
    return <LoadingSpinner />;
  }

  if (error) {
    console.error('❌ Dashboard error:', error);
    return <ErrorMessage message={error} />;
  }

  if (!auth0User) {
    console.log('⚠️ No Auth0 user found');
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      {serverUser && (
        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Doctor Information
              </h3>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Edit Profile
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {serverUser.first_name} {serverUser.last_name}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {serverUser.email}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {serverUser.roles.join(', ')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming Appointments
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">0</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/dashboard/appointments" className="font-medium text-primary hover:text-primary/90">
                    View all
                  </Link>
                </div>
              </div>
            </div>

            {/* Add more dashboard cards as needed */}
          </div>
        </div>
      )}
      {serverUser && (
        <UserEditDrawer
          user={serverUser}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onUserUpdate={(updatedUser) => setServerUser(updatedUser)}
        />
      )}
    </div>
  );
}