'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import Image from 'next/image';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
import { useTheme } from '@/components/theme/theme-provider';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, isLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="bg-background shadow-sm border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/icons/logo.svg"
                alt="HablaDoc"
                width={32}
                height={32}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center">
            {!isLoading && (
              <>
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button as={Button}
                        variant="ghost"
                        size="icon"
                        className="flex rounded-full focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      >
                        {user.picture ? (
                          <Image
                            className="h-8 w-8 rounded-full"
                            src={user.picture}
                            alt={user.name || ''}
                            width={32}
                            height={32}
                          />
                        ) : (
                          <UserIcon className="h-8 w-8 rounded-full p-1" />
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
                          {() => (
                            <Button
                              variant="ghost"
                              asChild
                              className="w-full justify-start"
                            >
                              <Link href="/dashboard">
                                Dashboard
                              </Link>
                            </Button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {() => (
                            <Button
                              variant="ghost"
                              asChild
                              className="w-full justify-start"
                            >
                              <Link href="/profile">
                                Perfil
                              </Link>
                            </Button>
                          )}
                        </Menu.Item>

                        {/* Theme options */}
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tema</p>
                          <div className="flex gap-2">
                            <Button
                              variant={theme === 'light' ? 'secondary' : 'ghost'}
                              size="icon"
                              onClick={() => setTheme("light")}
                              className="h-8 w-8"
                              title="Modo Claro"
                            >
                              <SunIcon className="h-5 w-5" />
                            </Button>
                            
                            <Button
                              variant={theme === 'dark' ? 'secondary' : 'ghost'}
                              size="icon"
                              onClick={() => setTheme("dark")}
                              className="h-8 w-8"
                              title="Modo Oscuro"
                            >
                              <MoonIcon className="h-5 w-5" />
                            </Button>
                            
                            <Button
                              variant={theme === 'system' ? 'secondary' : 'ghost'}
                              size="icon"
                              onClick={() => setTheme("system")}
                              className="h-8 w-8"
                              title="Tema del Sistema"
                            >
                              <ComputerDesktopIcon className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <Menu.Item>
                          {() => (
                            <Button
                              variant="ghost"
                              asChild
                              className="w-full justify-start border-t border-gray-200 dark:border-gray-700"
                            >
                              <Link href="/api/auth/logout">
                                Cerrar sesión
                              </Link>
                            </Button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      asChild
                    >
                      <Link href="/api/auth/login">
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button
                      variant="primary"
                      asChild
                    >
                      <Link href="/api/auth/signup">
                        Registrarse
                      </Link>
                    </Button>
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