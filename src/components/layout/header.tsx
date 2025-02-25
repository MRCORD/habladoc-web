'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import Image from 'next/image';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
import { useTheme } from '@/components/theme/theme-provider';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Header() {
  const { user, isLoading } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-background shadow-sm border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary">
              HablaDoc
            </Link>
          </div>
          <div className="flex items-center">
            {!isLoading && (
              <>
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        {user.picture ? (
                          <Image
                            className="h-8 w-8 rounded-full"
                            src={user.picture}
                            alt={user.name || ''}
                            width={32}
                            height={32}
                          />
                        ) : (
                          <UserIcon className="h-8 w-8 rounded-full p-1 border border-gray-300 dark:border-gray-600" />
                        )}
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-700' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                              )}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-700' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                              )}
                            >
                              Perfil
                            </Link>
                          )}
                        </Menu.Item>

                        {/* Theme options */}
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tema</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setTheme("light")}
                              className={`flex items-center justify-center h-8 w-8 rounded-md ${theme === "light" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                              title="Modo Claro"
                            >
                              <SunIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => setTheme("dark")}
                              className={`flex items-center justify-center h-8 w-8 rounded-md ${theme === "dark" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                              title="Modo Oscuro"
                            >
                              <MoonIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => setTheme("system")}
                              className={`flex items-center justify-center h-8 w-8 rounded-md ${theme === "system" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                              title="Tema del Sistema"
                            >
                              <ComputerDesktopIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/api/auth/logout"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-700' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700'
                              )}
                            >
                              Cerrar sesión
                            </Link>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/api/auth/login"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/api/auth/signup"
                      className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}