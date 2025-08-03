import React, {
  useState, useContext, useEffect, ReactNode, useMemo, useCallback,
} from 'react';
import { toast } from 'sonner';
import { authService } from '@/utils/auth';
import { User } from '@/types/shared';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, username?: string, isAdmin?: boolean, adminKey?: string) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get token from storage first
        const storedToken = authService.getToken();
        setToken(storedToken);

        // Try to get user from local storage first for instant UI update
        const storedUser = localStorage.getItem('userData');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        } else if (storedUser && !storedToken) {
          localStorage.removeItem('userData');
        }

        // Then verify with the server (if a token exists)
        if (storedToken) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('userData', JSON.stringify(currentUser));
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const response = await authService.login(email, password);
    if (response) {
      setUser(response.user);
      setToken(response.token);
      toast.success(`Welcome back, ${response.user.username || response.user.email}!`);
      return true;
    }
    setUser(null);
    setToken(null);
    return false;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    toast.info('You have been logged out');
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    username?: string,
    isAdmin: boolean = false,
    adminKey?: string,
  ): Promise<boolean> => await authService.signup(email, password, username, isAdmin, adminKey), []);

  const value = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin' || false,
        token,
        login,
        logout,
        signup,
  }), [user, isLoading, token, login, logout, signup]);

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the context and type for use in the separate hook file
export { AuthContext };
export type { AuthContextType };
