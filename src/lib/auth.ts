// lib/auth.ts
import { getSession } from '@auth0/nextjs-auth0';
import { User } from '@/types';

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user as unknown as User;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export function isDoctor(user: User) {
  return user.roles.includes('doctor');
}

export function isAdmin(user: User) {
  return user.roles.includes('admin');
}