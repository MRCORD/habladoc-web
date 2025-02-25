// src/components/dashboard/user-edit-drawer.tsx
import React, { useState } from 'react';
import { User } from '@/types';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { ErrorMessage } from '@/components/common/error-message';
import { UserEditFormSkeleton } from '@/components/common/loading-skeletons';
import { XIcon } from 'lucide-react';

interface ErrorResponse {
  message: string;
}

interface UserEditDrawerProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const UserEditDrawer = ({ user, isOpen, onClose, onUserUpdate }: UserEditDrawerProps) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form data when user changes
  React.useEffect(() => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const dataToSubmit = {
        ...formData,
        // Only include phone if it's not empty
        phone: formData.phone || undefined
      };

      const response = await api.patch(`/api/v1/users/${user.id}`, dataToSubmit);
      onUserUpdate(response.data);
      onClose();
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(error.response?.data?.message || 'Failed to update user data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" onClick={onClose} />
        
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              <div className="flex-1 h-0 overflow-y-auto">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Editar Perfil</h2>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                    >
                      <XIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="px-4 sm:px-6">
                    {error && <ErrorMessage message={error} />}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-primary dark:focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Apellido
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-primary dark:focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-primary dark:focus:ring-primary sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-primary dark:focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                        >
                          {isSubmitting ? <UserEditFormSkeleton /> : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditDrawer;