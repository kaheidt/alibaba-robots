import { apiClient } from './apiClient';

export interface User {
  id: number;  // Changed from optional to required
  username: string;
  displayName?: string;
  createdAt?: string;
  isGuest: boolean;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

const AUTH_STORAGE_KEY = 'roboverse_auth';

export const authService = {
  async register(
    username: string,
    password: string,
    displayName?: string,
    isGuest: boolean = false
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<User>('/auth/register', {
        username,
        password,
        displayName,
        isGuest
      });

      if (response.success && response.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: response.user
        }));

        return {
          success: true,
          message: response.message || 'Registration successful',
          user: response.user
        };
      }

      return {
        success: false,
        message: response.error || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<User>('/auth/login', {
        username,
        password
      });

      if (response.success && response.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: response.user
        }));

        return {
          success: true,
          message: response.message || 'Login successful',
          user: response.user
        };
      }

      return {
        success: false,
        message: response.error || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  },

  async createGuestAccount(): Promise<AuthResponse> {
    try {
      const guestId = `guest_${Date.now()}`;
      const registerResult = await this.register(
        guestId,
        guestId,
        'Guest Player',
        true
      );

      if (registerResult.success && registerResult.user) {
        return {
          success: true,
          message: 'Login successful',
          user: {
            ...registerResult.user,
            isGuest: true
          }
        };
      }

      return {
        success: false,
        message: registerResult.message
      };
    } catch (error) {
      console.error('Guest account creation error:', error);
      return {
        success: false,
        message: 'Failed to create guest account'
      };
    }
  },

  isAuthenticated(): boolean {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    return auth !== null;
  },

  getCurrentUser(): User | null {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (auth) {
      const { user } = JSON.parse(auth);
      return user;
    }
    return null;
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  async updateProfile(
    userId: number,
    updates: Partial<User>
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<User>(`/auth/profile/${userId}`, updates);

      if (response.success) {
        // Update local storage
        const auth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (auth) {
          const data = JSON.parse(auth);
          data.user = { ...data.user, ...updates };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        }

        return {
          success: true,
          message: response.message || 'Profile updated successfully'
        };
      }

      return {
        success: false,
        message: response.error || 'Failed to update profile'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }
};