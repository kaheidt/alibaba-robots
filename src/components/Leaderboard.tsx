import { useState, useEffect } from 'react'
import { leaderboardApi, LeaderboardEntry } from '../services/leaderboardApi'
import '../styles/Leaderboard.css'

export default function Leaderboard({ onClose }: { onClose?: () => void }) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true)
        // Use the browser-compatible leaderboardApi
        const data = await leaderboardApi.getLeaderboard(50)
        setLeaderboardData(data)
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
        setError('Failed to load leaderboard. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboard()
  }, [])
  
  // Helper function to safely display player name
  const getPlayerName = (entry: LeaderboardEntry): string => {
    if (entry.player_name) return entry.player_name;
    if (!entry.player_id) return 'Unknown Player';
    
    // Try to get the first part before a dash, or use the whole id
    const parts = entry.player_id.split('-');
    return parts.length > 0 ? parts[0] : entry.player_id;
  };
  
  // Format date safely
  const formatDate = (timestamp?: Date | string): string => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString();
  };
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>Global Leaderboard</h2>
        {onClose && <button className="close-button" onClick={onClose}>Close</button>}
      </div>
      
      {loading ? (
        <div className="leaderboard-loading">Loading scores...</div>
      ) : error ? (
        <div className="leaderboard-error">{error}</div>
      ) : leaderboardData.length === 0 ? (
        <div className="leaderboard-empty">No scores yet. Be the first to battle!</div>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-row header">
            <div className="rank">Rank</div>
            <div className="player">Player</div>
            <div className="score">Score</div>
            <div className="date">Date</div>
          </div>
          
          {leaderboardData.map((entry, index) => (
            <div key={entry.id || `${entry.player_id}-${index}`} className="leaderboard-row">
              <div className="rank">{index + 1}</div>
              <div className="player">{getPlayerName(entry)}</div>
              <div className="score">{entry.score}</div>
              <div className="date">{formatDate(entry.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}