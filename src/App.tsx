import { Suspense, useState, useEffect } from 'react'
import GameScene from './components/GameScene'
import RobotCustomizer from './components/RobotCustomizer'
import BattleMode from './components/BattleMode'
import Leaderboard from './components/Leaderboard'
import AuthPage from './components/AuthPage'
import { useGameStore } from './store/gameStore'
import { authService } from './services/authService'
import { audioManager } from './utils/audioManager'
import './App.css'

function App() {
  const score = useGameStore((state) => state.score)
  const loadPlayerScore = useGameStore((state) => state.loadPlayerScore)
  const inBattle = useGameStore((state) => state.inBattle)
  const [showBattleMode, setShowBattleMode] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const isAuthed = authService.isAuthenticated()
      setIsAuthenticated(isAuthed)
      if (isAuthed) {
        await loadPlayerScore() // Load score if authenticated
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [loadPlayerScore])
  
  // Preload audio assets when the app launches
  useEffect(() => {
    // Start preloading audio files immediately
    audioManager.preloadAssets().catch(err => {
      console.error('Error preloading audio assets:', err)
    })
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />
  }

  const currentUser = authService.getCurrentUser();
  const displayName = currentUser?.displayName || currentUser?.username || 'Unknown User';

  return (
    <div className="app">
      <div className="game-ui">
        <h1>RoboVerse</h1>
        <div className="score">Score: {score}</div>
        
        <div className="game-buttons">
          {!inBattle && (
            <button 
              className="battle-button" 
              onClick={() => setShowBattleMode(!showBattleMode)}
            >
              {showBattleMode ? 'Build Mode' : 'Battle Mode'}
            </button>
          )}
          
          <button
            className="leaderboard-button"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
          </button>
          
          <button
            className="logout-button"
            onClick={() => {
              authService.logout();
              setIsAuthenticated(false);
            }}
          >
            Logout ({displayName})
          </button>
        </div>
      </div>
      
      {!inBattle && !showBattleMode && <RobotCustomizer />}
      {(showBattleMode || inBattle) && <BattleMode onClose={() => setShowBattleMode(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      
      <div className="game-container">
        <Suspense fallback={<div>Loading...</div>}>
          <GameScene />
        </Suspense>
      </div>
    </div>
  )
}

export default App
