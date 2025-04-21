// Browser-compatible API client for leaderboard services

// Define types for leaderboard entries
export interface LeaderboardEntry {
  id?: number;
  player_id: string;
  player_name?: string;
  score: number;
  robot_id?: string;
  timestamp?: Date | string;
}

// Get base API URL from environment or fallback to local storage mode
const API_URL = import.meta.env.VITE_API_URL;

// LocalStorage key for offline leaderboard data
const STORAGE_KEY = 'alibaba_robots_leaderboard';

// Maximum entries to keep in local storage
const MAX_LOCAL_ENTRIES = 100;

// Helper to sort leaderboard entries by score (highest first)
const sortByScore = (a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score;

/**
 * Get leaderboard data, either from API or local storage
 */
async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  // If we have an API URL, use it
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data as LeaderboardEntry[];
    } catch (error) {
      console.error('Failed to fetch leaderboard from API:', error);
      // Fall back to local storage if API fails
      return getLocalLeaderboard(limit);
    }
  }
  
  // No API URL, use local storage
  return getLocalLeaderboard(limit);
}

/**
 * Get leaderboard data from local storage
 */
function getLocalLeaderboard(limit = 50): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const entries = JSON.parse(data) as LeaderboardEntry[];
    return entries.sort(sortByScore).slice(0, limit);
  } catch (error) {
    console.error('Failed to read leaderboard from local storage:', error);
    return [];
  }
}

/**
 * Update or create a leaderboard entry
 */
async function updateLeaderboard(
  score: number, 
  playerId: string, 
  playerName?: string, 
  robotId?: string
): Promise<boolean> {
  // Create entry object
  const entry: LeaderboardEntry = {
    player_id: playerId,
    player_name: playerName,
    score: score,
    robot_id: robotId,
    timestamp: new Date().toISOString()
  };
  
  // If we have an API URL, use it
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to update API leaderboard:', error);
      // Fall back to local storage
      return updateLocalLeaderboard(entry);
    }
  }
  
  // No API URL, use local storage
  return updateLocalLeaderboard(entry);
}

/**
 * Update the leaderboard in local storage
 */
function updateLocalLeaderboard(entry: LeaderboardEntry): boolean {
  try {
    // Get existing entries
    let entries: LeaderboardEntry[] = [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      entries = JSON.parse(data);
    }
    
    // Find existing entry for this player
    const existingIndex = entries.findIndex(e => e.player_id === entry.player_id);
    
    if (existingIndex >= 0) {
      // Only update if new score is higher
      if (entry.score > entries[existingIndex].score) {
        entries[existingIndex] = {
          ...entries[existingIndex],
          ...entry
        };
      }
    } else {
      // Add new entry
      entries.push({
        ...entry,
        id: Date.now() // Generate a pseudorandom ID
      });
    }
    
    // Sort and limit entries
    entries = entries.sort(sortByScore).slice(0, MAX_LOCAL_ENTRIES);
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to update local leaderboard:', error);
    return false;
  }
}

/**
 * Get entries for a specific player
 */
async function getPlayerEntries(playerId: string): Promise<LeaderboardEntry[]> {
  // If we have an API URL, use it
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/leaderboard/player/${encodeURIComponent(playerId)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data as LeaderboardEntry[];
    } catch (error) {
      console.error('Failed to fetch player entries from API:', error);
      // Fall back to local storage
      return getLocalPlayerEntries(playerId);
    }
  }
  
  // No API URL, use local storage
  return getLocalPlayerEntries(playerId);
}

/**
 * Get entries for a specific player from local storage
 */
function getLocalPlayerEntries(playerId: string): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const entries = JSON.parse(data) as LeaderboardEntry[];
    return entries
      .filter(entry => entry.player_id === playerId)
      .sort(sortByScore);
  } catch (error) {
    console.error('Failed to read player entries from local storage:', error);
    return [];
  }
}

// Export the API functions
export const leaderboardApi = {
  getLeaderboard,
  updateLeaderboard,
  getPlayerEntries
};