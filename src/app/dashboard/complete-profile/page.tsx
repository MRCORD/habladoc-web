// app/dashboard/complete-profile/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';

export default function CompleteProfile() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [formData, setFormData] = useState({
    specialty: '',
    license_number: '',
    phone: '',
    languages: ['es'], // Spanish by default
    accepting_new_patients: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create doctor profile
      await api.post('/api/v1/doctors/profile', formData);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create doctor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Complete Your Profile</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Please provide your professional information to complete your registration.
          </p>

          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="specialty" className="block text-sm font-medium leading-6 text-gray-900">
                  Medical Specialty
                </label>
                <div className="mt-2">
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    required
                  >
                    <option value="">Select a specialty</option>
                    <option value="family-medicine">Family Medicine</option>
                    <option value="internal-medicine">Internal Medicine</option>
                    <option value="pediatrics">Pediatrics</option>
                    {/* Add more specialties */}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="license" className="block text-sm font-medium leading-6 text-gray-900">
                  Medical License Number
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                  Phone Number
                </label>
                <div className="mt-2">
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      type="checkbox"
                      id="accepting"
                      checked={formData.accepting_new_patients}
                      onChange={(e) => setFormData({ ...formData, accepting_new_patients: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="accepting" className="font-medium text-gray-900">
                      Accepting New Patients
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}