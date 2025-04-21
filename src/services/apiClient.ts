// API client for communicating with the backend server

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  user?: T;
}

export const apiClient = {
  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await response.json();
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      return {
        success: false,
        message: 'Failed to connect to server'
      };
    }
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      return {
        success: false,
        message: 'Failed to connect to server'
      };
    }
  }
};