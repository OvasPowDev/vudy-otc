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
    login: (userData: User) => authManager.setUser(userData),
    logout: () => authManager.signOut(),
    signOut: () => authManager.signOut(),
    isAuthenticated: !!user,
  };
}
