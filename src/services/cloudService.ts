import { RobotPart } from '../store/gameStore';
import { authService } from './authService';

interface RobotStats {
  attack: number;
  defense: number;
  speed: number;
  health: number;
}

export interface SavedRobot {
  id: string;
  name: string;
  parts: RobotPart[];
  score?: number;
  stats?: RobotStats;
}

// Get base API URL from environment
const API_URL = import.meta.env.VITE_API_URL;

export const cloudService = {
  // Save robot design
  async saveRobot(robot: SavedRobot): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unauthorized: Please log in to save robots');
      }

      const response = await fetch(`${API_URL}/storage/robots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          robot
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save robot');
      }
    } catch (error) {
      console.error('Error saving robot:', error);
      throw error;
    }
  },

  // Load robot design
  async loadRobot(robotId: string): Promise<SavedRobot | null> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unauthorized: Please log in to load robots');
      }

      const response = await fetch(`${API_URL}/storage/robots/${currentUser.id}/${robotId}`);
      if (!response.ok) {
        throw new Error('Failed to load robot');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading robot:', error);
      return null;
    }
  },

  // Get all saved robots for current user
  async getAllRobots(): Promise<SavedRobot[]> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unauthorized: Please log in to view robots');
      }

      const response = await fetch(`${API_URL}/storage/robots/${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch robots');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting all robots:', error);
      return [];
    }
  },

  // Delete robot design
  async deleteRobot(robotId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unauthorized: Please log in to delete robots');
      }

      const response = await fetch(`${API_URL}/storage/robots/${currentUser.id}/${robotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete robot');
      }
    } catch (error) {
      console.error('Error deleting robot:', error);
      throw error;
    }
  }
};