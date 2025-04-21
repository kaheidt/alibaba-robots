interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  score: number;
  robot_id: string;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export const dbService = {
  // Update leaderboard entry
  async updateLeaderboard(
    score: number, 
    playerId: string, 
    playerName?: string, 
    robotId?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: playerId,
          player_name: playerName,
          score,
          robot_id: robotId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update leaderboard');
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  },
  
  // Get top leaderboard entries
  async getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },
  
  // Get leaderboard entries for a specific player
  async getPlayerEntries(playerId: string): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${API_URL}/leaderboard/player/${playerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player entries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching player entries:', error);
      return [];
    }
  }
};