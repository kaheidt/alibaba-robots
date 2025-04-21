import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '../authService'
import { apiClient } from '../apiClient'

// Mock the API client
vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should store user data in localStorage on successful login', async () => {
      const mockUser = {
        id: 3,
        username: 'testuser',
        displayName: 'Test User',
        createdAt: '2025-04-14T20:22:22.000Z',
        isGuest: false
      };

      (apiClient.post as any).mockResolvedValueOnce({
        success: true,
        message: 'Login successful',
        user: mockUser
      });

      const result = await authService.login('testuser', 'password');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.user).toEqual(mockUser);

      // Check localStorage
      const storedAuth = localStorage.getItem('roboverse_auth');
      expect(storedAuth).toBeDefined();
      
      const authData = JSON.parse(storedAuth!);
      expect(authData.user).toEqual(mockUser);
    });

    it('should handle failed login', async () => {
      (apiClient.post as any).mockResolvedValueOnce({
        success: false,
        error: 'Invalid username or password'
      });

      const result = await authService.login('testuser', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid username or password');
      expect(localStorage.getItem('roboverse_auth')).toBeNull();
    });

    it('should handle API errors', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.login('testuser', 'password');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Login failed');
      expect(localStorage.getItem('roboverse_auth')).toBeNull();
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: 4,
        username: 'newuser',
        displayName: 'New User',
        createdAt: '2025-04-14T20:22:22.000Z',
        isGuest: false
      };

      (apiClient.post as any).mockResolvedValueOnce({
        success: true,
        message: 'Registration successful',
        user: mockUser
      });

      const result = await authService.register('newuser', 'password123', 'New User');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
      expect(result.user).toEqual(mockUser);

      // Check localStorage
      const storedAuth = localStorage.getItem('roboverse_auth');
      expect(storedAuth).toBeDefined();
      const authData = JSON.parse(storedAuth!);
      expect(authData.user).toEqual(mockUser);
    });

    it('should handle registration with weak password', async () => {
      (apiClient.post as any).mockResolvedValueOnce({
        success: false,
        error: 'Password must be at least 6 characters long'
      });

      const result = await authService.register('newuser', '123', 'New User');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 6 characters long');
      expect(localStorage.getItem('roboverse_auth')).toBeNull();
    });

    it('should handle username conflict', async () => {
      (apiClient.post as any).mockResolvedValueOnce({
        success: false,
        error: 'Username already exists'
      });

      const result = await authService.register('existinguser', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
      expect(localStorage.getItem('roboverse_auth')).toBeNull();
    });
  });

  describe('createGuestAccount', () => {
    it('should create and login as guest', async () => {
      const guestId = `guest_${Date.now()}`;
      const mockUser = {
        id: 5,
        username: guestId,
        displayName: 'Guest Player',
        createdAt: new Date().toISOString(),
        isGuest: true
      };

      // Mock the register endpoint response
      (apiClient.post as any).mockImplementationOnce(() => Promise.resolve({
        success: true,
        message: 'Registration successful',
        user: mockUser
      }));

      const result = await authService.createGuestAccount();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.user?.isGuest).toBe(true);

      // Verify localStorage
      const storedAuth = localStorage.getItem('roboverse_auth');
      expect(storedAuth).toBeDefined();
      expect(JSON.parse(storedAuth!).user.isGuest).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return user data when logged in', async () => {
      const mockUser = {
        id: 3,
        username: 'testuser',
        displayName: 'Test User',
        createdAt: '2025-04-14T20:22:22.000Z',
        isGuest: false
      };

      localStorage.setItem('roboverse_auth', JSON.stringify({ user: mockUser }));
      
      const user = authService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear auth data from localStorage', async () => {
      const mockUser = {
        id: 3,
        username: 'testuser',
        displayName: 'Test User',
        isGuest: false
      };

      localStorage.setItem('roboverse_auth', JSON.stringify({ user: mockUser }));
      
      authService.logout();
      
      expect(localStorage.getItem('roboverse_auth')).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and localStorage', async () => {
      const mockUser = {
        id: 3,
        username: 'testuser',
        displayName: 'Test User',
        isGuest: false
      };

      localStorage.setItem('roboverse_auth', JSON.stringify({ user: mockUser }));

      const updates = { displayName: 'Updated Name' };
      (apiClient.post as any).mockResolvedValueOnce({
        success: true,
        message: 'Profile updated successfully'
      });

      const result = await authService.updateProfile(mockUser.id, updates);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');

      // Check if localStorage was updated
      const storedAuth = JSON.parse(localStorage.getItem('roboverse_auth')!);
      expect(storedAuth.user.displayName).toBe('Updated Name');
    });
  });
});