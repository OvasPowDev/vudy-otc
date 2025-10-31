import { useState, useEffect } from 'react';
import { authManager, type User } from '@lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authManager.getUser());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setUser);
    return unsubscribe;
  }, []);

  return {
    user,
    signOut: () => authManager.signOut(),
    isAuthenticated: !!user,
  };
}
