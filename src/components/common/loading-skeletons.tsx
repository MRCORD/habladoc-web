// components/common/loading-skeletons.tsx
import React from 'react';

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Welcome Section Skeleton */}
    <div className="mb-8">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
    </div>

    {/* Stats Grid Skeleton */}
    <StatsGridSkeleton />

    {/* Sessions List Skeleton */}
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <SessionListSkeleton />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      {/* Header Skeleton */}
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const SessionSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>

    {/* Patient Info Skeleton */}
    <div className="max-w-screen-lg mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recording Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const PatientDisplaySkeleton = () => (
  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export function AnalysisDisplaySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="space-y-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const StatsGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 animate-pulse">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
        <div className="text-center">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 mx-auto"></div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SessionListSkeleton = () => (
  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
    {[...Array(5)].map((_, i) => (
      <li key={i} className="px-4 py-4 sm:px-6 animate-pulse">
        <div className="flex justify-between">
          <div>
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </li>
    ))}
  </ul>
);

export const NewSessionSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header Skeleton */}
    <div className="mb-8">
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mr-2 animate-pulse"></div>
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-4 animate-pulse"></div>
    </div>

    {/* Search Box Skeleton */}
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
      <div className="max-w-xl">
        <div className="flex gap-4">
          <div className="block w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export const CreatePatientFormSkeleton = () => (
  <div className="inline-flex items-center">
    <div className="h-5 w-5 bg-white/20 rounded animate-pulse"></div>
    <div className="h-5 w-20 bg-white/20 rounded ml-2 animate-pulse"></div>
  </div>
);

export const CompleteProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

export const UserEditFormSkeleton = () => (
  <div className="inline-flex items-center">
    <div className="h-5 w-5 bg-white/20 rounded animate-pulse"></div>
    <div className="h-5 w-20 bg-white/20 rounded ml-2 animate-pulse"></div>
  </div>
);

export const PatientActionsSkeleton = () => (
  <div className="inline-flex items-center gap-2">
    <div className="h-5 w-5 bg-white/20 rounded animate-pulse"></div>
    <div className="h-5 w-24 bg-white/20 rounded animate-pulse"></div>
  </div>
);

export const AudioRecorderSkeleton = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-primary p-4 flex items-center justify-center text-white">
    <div className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-white/20 rounded-full animate-pulse"></div>
      <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
    </div>
  </div>
);