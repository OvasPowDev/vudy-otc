export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

class AuthManager {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validate that ID is a UUID, not an email (legacy sessions cleanup)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (parsedUser.id && uuidRegex.test(parsedUser.id)) {
          this.user = parsedUser;
        } else {
          console.warn('Cleaning up legacy session with email as ID');
          localStorage.removeItem('user');
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  getUser(): User | null {
    return this.user;
  }

  setUser(user: User | null) {
    this.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    this.notifyListeners();
  }

  subscribe(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  async signOut() {
    this.setUser(null);
  }
}

export const authManager = new AuthManager();
