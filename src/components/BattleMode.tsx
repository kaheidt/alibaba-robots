import { useEffect, useState } from 'react'
import { useGameStore, Robot, RobotStats, BattleMove } from '../store/gameStore'
import { audioManager } from '../utils/audioManager'
import '../styles/BattleMode.css'

// Sample enemy robots with varied strategies
const ENEMY_ROBOTS: Robot[] = [
  {
    id: 'enemy-1',
    name: 'Destroyer-9000',
    parts: [],
    stats: { attack: 8, defense: 6, speed: 5, health: 100 }
  },
  {
    id: 'enemy-2',
    name: 'Speedy Slasher',
    parts: [],
    stats: { attack: 6, defense: 4, speed: 9, health: 80 }
  },
  {
    id: 'enemy-3',
    name: 'Heavy Tank',
    parts: [],
    stats: { attack: 5, defense: 10, speed: 3, health: 150 }
  },
  {
    id: 'enemy-4',
    name: 'Glass Cannon',
    parts: [],
    stats: { attack: 12, defense: 2, speed: 7, health: 60 }
  },
  {
    id: 'enemy-5',
    name: 'Balanced Fighter',
    parts: [],
    stats: { attack: 7, defense: 7, speed: 7, health: 100 }
  },
  {
    id: 'enemy-6',
    name: 'Shield Master',
    parts: [],
    stats: { attack: 4, defense: 12, speed: 4, health: 120 }
  }
]

interface BattleModeProps {
  onClose?: () => void;
}

export default function BattleMode({ onClose }: BattleModeProps) {
  const { 
    inBattle,
    battleLog,
    currentRobot, 
    enemyRobot,
    savedRobots,
    setPlayerMove,
    setCurrentRobot,
    setEnemyRobot,
    startBattle,
    endBattle,
    loadSavedRobots
  } = useGameStore()
  
  const [loading, setLoading] = useState(false)
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null)
  
  // Load saved robots when component mounts
  useEffect(() => {
    const loadRobots = async () => {
      setLoading(true)
      await loadSavedRobots()
      setLoading(false)
    }
    
    loadRobots()
  }, [loadSavedRobots])

  // Watch for battle end conditions
  useEffect(() => {
    if (!currentRobot?.stats || !enemyRobot?.stats) return
    
    if (currentRobot.stats.health <= 0) {
      setBattleResult('defeat')
    } else if (enemyRobot.stats.health <= 0) {
      setBattleResult('victory')
    }
  }, [currentRobot?.stats, enemyRobot?.stats])
  
  // Start background percussion music when component mounts and stop when unmounting
  useEffect(() => {
    console.log('Starting battle background music')
    audioManager.startBattleMusic()
    
    // Cleanup function to stop music when component unmounts
    return () => {
      console.log('Stopping battle background music on unmount')
      audioManager.stopBattleMusic()
    }
  }, [])

  const handleStartBattle = (robot: Robot) => {
    setBattleResult(null)
    setCurrentRobot(robot)
    const randomEnemy = ENEMY_ROBOTS[Math.floor(Math.random() * ENEMY_ROBOTS.length)]
    setEnemyRobot(randomEnemy)
    startBattle()
  }
  
  const handleEndBattle = () => {
    // Only end battle and close if there's no result pending
    if (!battleResult) {
      endBattle()
      if (onClose) onClose()
    }
  }
  
  const handleMoveSelect = (move: BattleMove) => {
    setPlayerMove(move)
    audioManager.playBossStrikeSound()
  }

  const handleBattleComplete = () => {
    setBattleResult(null)  // Reset result first
    endBattle()
    // Don't call onClose() here - just return to battle selection screen
  }

  // Keep battle open when there's a result
  useEffect(() => {
    if (battleResult) {
      // Don't auto-close the battle when there's a result
      return;
    }
  }, [battleResult]);
  
  // Display loading state
  if (loading) {
    return <div className="battle-mode loading">Loading robots...</div>
  }
  
  // Display battle screen if in battle
  if (inBattle && currentRobot && enemyRobot) {
    return (
      <div className="battle-mode">
        <div className="battle-header">
          <h2>Battle Mode</h2>
          <button className="exit-battle" onClick={handleEndBattle}>Exit Battle</button>
        </div>
        
        <div className="battle-arena">
          <div className="robot-stats player">
            <h3>{currentRobot.name}</h3>
            <RobotStatsDisplay stats={currentRobot.stats} />
          </div>
          
          <div className="battle-controls">
            {!battleResult && (
              <>
                <button 
                  className="move-button laser"
                  onClick={() => handleMoveSelect('laser')}
                  disabled={!currentRobot.stats || currentRobot.stats.health <= 0}
                >
                  Laser
                </button>
                <button 
                  className="move-button shield"
                  onClick={() => handleMoveSelect('shield')}
                  disabled={!currentRobot.stats || currentRobot.stats.health <= 0}
                >
                  Shield
                </button>
                <button 
                  className="move-button missile"
                  onClick={() => handleMoveSelect('missile')}
                  disabled={!currentRobot.stats || currentRobot.stats.health <= 0}
                >
                  Missile
                </button>
              </>
            )}
          </div>
          
          <div className="robot-stats enemy">
            <h3>{enemyRobot.name}</h3>
            <RobotStatsDisplay stats={enemyRobot.stats} />
          </div>
        </div>
        
        <div className="battle-info">
          <div className="move-info">
            <h4>Move Types:</h4>
            <ul>
              <li>Laser beats Shield</li>
              <li>Shield blocks Missile</li>
              <li>Missile beats Laser</li>
            </ul>
          </div>
        </div>
        
        <div className="battle-log">
          <h4>Battle Log</h4>
          <div className="log-entries">
            {battleLog.map((entry, index) => (
              <div key={index} className="log-entry">{entry}</div>
            ))}
          </div>
          {battleResult && (
            <button 
              className={`battle-result-button ${battleResult}`}
              onClick={handleBattleComplete}
            >
              {battleResult === 'victory' ? 'Victory!' : 'Defeat'}
              <span className="click-hint">Click to continue</span>
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Display robot selection for battle
  return (
    <div className="battle-mode selection">
      <div className="battle-header">
        <h2>Select a Robot for Battle</h2>
        {onClose && <button className="close-button" onClick={onClose}>Back to Building</button>}
      </div>
      
      {savedRobots.length === 0 ? (
        <div className="no-robots">
          <p>You don't have any saved robots yet. Build and save a robot to battle!</p>
        </div>
      ) : (
        <div className="robot-selection">
          {savedRobots.map((robot) => (
            <div key={robot.id} className="robot-card">
              <h3>{robot.name}</h3>
              <RobotStatsDisplay stats={robot.stats || { attack: 0, defense: 0, speed: 0, health: 0 }} />
              <button onClick={() => handleStartBattle(robot)}>Battle</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper component to display robot stats
function RobotStatsDisplay({ stats }: { stats?: RobotStats }) {
  if (!stats) return null;
  
  const { attack, defense, speed, health } = stats;
  
  return (
    <div className="stats-display">
      <div className="stat-row">
        <div className="stat-label">Health:</div>
        <div className="stat-bar">
          <div className="stat-value" style={{ width: `${Math.min(100, health)}%` }}>
            {health}
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Attack:</div>
        <div className="stat-bar">
          <div className="stat-value" style={{ width: `${Math.min(100, attack * 5)}%` }}>
            {attack}
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Defense:</div>
        <div className="stat-bar">
          <div className="stat-value" style={{ width: `${Math.min(100, defense * 5)}%` }}>
            {defense}
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Speed:</div>
        <div className="stat-bar">
          <div className="stat-value" style={{ width: `${Math.min(100, speed * 5)}%` }}>
            {speed}
          </div>
        </div>
      </div>
    </div>
  );
}