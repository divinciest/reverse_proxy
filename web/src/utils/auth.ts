import { toast } from 'sonner';
import api from './api'; // Import the configured axios instance
import { User } from '@/types/shared';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async signup(email: string, password: string, username?: string, isAdmin: boolean = false, adminKey?: string): Promise<boolean> {
    try {
      // Use api.post - interceptor handles base URL and headers
      await api.post('/signup', {
        email,
        password,
        username,
        role: isAdmin ? 'admin' : 'user',
        admin_key: isAdmin ? adminKey : undefined,
      });
      // Axios throws for non-2xx, so if we reach here, it's successful
      toast.success('Registration successful! Please sign in.');
      return true;
    } catch (error: any) {
      // Axios error object has response.data
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'An error occurred during registration.';
      console.error('Signup error:', error.response?.data || error.message);
      toast.error(errorMsg);
      return false;
    }
  },

  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      console.log('[AUTH] Attempting login for:', email);
      const response = await api.post<AuthResponse>('/signin', { email, password });

      // --- Successful Login ---
      console.log('[AUTH] Login response received:', response);
      const { data } = response; // Data is directly in response.data
      console.log('[AUTH] Response data:', data);

      // Validate response structure
      if (!data || !data.token || !data.user) {
        console.error('[AUTH] Invalid response structure:', data);
        toast.error('Invalid response from server. Please try again.');
        return null;
      }

      // Store the token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      console.log('[AUTH] Login successful, token stored');
      return data;
      // --- End Successful Login ---
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      console.error('[AUTH] Error response:', error.response);
      
      // Axios interceptor might handle some errors globally (like 500s)
      // But we can still catch specific errors here if needed
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check credentials or try again later.';
      console.error('Login error details:', error.response?.data || error.message);
      // Avoid double-toasting if interceptor already showed one
      if (!error.response || (error.response.status !== 401 && error.response.status < 500)) {
        toast.error(errorMsg);
      }
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null; // No need to make API call if no token
    }

    try {
      // Interceptor adds token header
      const response = await api.get<User>('/me');
      return response.data; // Return user data
    } catch (error: any) {
      // Interceptor handles 401 by clearing token, but we catch other errors
      console.error('Error getting current user:', error.response?.data || error.message);
      // If it was a 401, the interceptor already cleared the token
      if (error.response?.status !== 401) {
        // Handle other errors if necessary, maybe show a toast
        // toast.error("Could not fetch user profile.");
      }
      return null;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Optional: Redirect after logout
    // redirect to the home page but only if we are not on the home page
    if (window.location.pathname !== '/') {
      window.location.href = '/'; // Or use react-router navigate
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  isAdmin(): boolean {
    const userData = localStorage.getItem('userData');
    if (!userData) return false;
    try {
      const user: User = JSON.parse(userData);
      return user.role === 'admin';
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
      return false;
    }
  },
};
