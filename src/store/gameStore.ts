import { create } from 'zustand'
import { authService } from '../services/authService';

export interface RobotPart {
  id: string
  type: 'head' | 'body' | 'arm' | 'leg'
  position: [number, number, number]
  rotation: [number, number, number]
  customColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export type BattleMove = 'laser' | 'shield' | 'missile';

export interface BattleState {
  playerMove: BattleMove | null;
  enemyMove: BattleMove | null;
}

export interface Robot {
  id: string
  name: string
  parts: RobotPart[]
  stats?: RobotStats
  score?: number
}

export interface RobotStats {
  attack: number
  defense: number
  speed: number
  health: number
}

export interface BattleAction {
  type: 'attack' | 'defend' | 'special'
  damage?: number
  description: string
}

interface GameState {
  score: number
  robotParts: RobotPart[]
  selectedPart: string | null
  currentRobot: Robot | null
  enemyRobot: Robot | null
  inBattle: boolean
  battleLog: string[]
  savedRobots: Robot[]
  playerMove: BattleMove | null
  
  // Actions
  setScore: (score: number) => void
  addRobotPart: (part: RobotPart) => void
  setSelectedPart: (partId: string | null) => void
  setCurrentRobot: (robot: Robot) => void
  setEnemyRobot: (robot: Robot) => void
  startBattle: () => void
  endBattle: () => void
  addBattleLog: (message: string) => void
  attackEnemy: () => void
  saveRobot: (name: string) => Promise<void>
  loadSavedRobots: () => Promise<void>
  calculateRobotStats: (parts: RobotPart[]) => RobotStats
  loadRobot: (robotId: string) => Promise<boolean>
  deleteRobot: (robotId: string) => Promise<boolean>
  setPlayerMove: (move: BattleMove) => void
  loadPlayerScore: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  robotParts: [],
  selectedPart: null,
  currentRobot: null,
  enemyRobot: null,
  inBattle: false,
  battleLog: [],
  savedRobots: [],
  playerMove: null,
  
  setScore: (score) => set({ score }),
  
  addRobotPart: (part) => set((state) => {
    // Remove any existing part of the same type
    const filteredParts = state.robotParts.filter(p => p.type !== part.type);
    return { 
      robotParts: [...filteredParts, part] 
    }
  }),
  
  setSelectedPart: (partId) => set({ selectedPart: partId }),
  
  setCurrentRobot: (robot) => set({ currentRobot: robot }),
  
  setEnemyRobot: (robot) => {
    // If the robot doesn't have parts, generate random ones
    if (!robot.parts || robot.parts.length === 0) {
      const headTypes = ['Standard', 'Battle', 'Scout'];
      const bodyTypes = ['Light', 'Medium', 'Heavy'];
      const armTypes = ['Laser', 'Plasma', 'Missile'];
      const legTypes = ['Wheels', 'Tracks', 'Legs'];

      // Random part selection
      const randomHead = headTypes[Math.floor(Math.random() * headTypes.length)];
      const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
      const randomArm = armTypes[Math.floor(Math.random() * armTypes.length)];
      const randomLeg = legTypes[Math.floor(Math.random() * legTypes.length)];

      // Generate random colors
      const getRandomColor = () => {
        const colors = [
          '#ff0000', '#00ff00', '#0000ff',  // Primary colors
          '#ff00ff', '#00ffff', '#ffff00',  // Secondary colors
          '#444444', '#666666', '#888888',  // Grays
          '#8B0000', '#006400', '#00008B',  // Dark variants
          '#FF4500', '#32CD32', '#4169E1'   // Bright variants
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      };

      const headAccent = getRandomColor();
      const armAccent = getRandomColor();

      robot.parts = [
        { 
          id: `head-${randomHead}-enemy`, 
          type: 'head',
          position: [0, 2.5, 0],
          rotation: [0, 0, 0],
          customColors: { 
            primary: '#444444', 
            secondary: '#333333', 
            accent: headAccent
          } 
        },
        { 
          id: `body-${randomBody}-enemy`, 
          type: 'body',
          position: [0, 1.5, 0],
          rotation: [0, 0, 0],
          customColors: { 
            primary: getRandomColor(), 
            secondary: '#1d1d1d', 
            accent: '#3d3d3d' 
          } 
        },
        { 
          id: `arm-${randomArm}-enemy`, 
          type: 'arm',
          position: [0, 1.7, 0],
          rotation: [0, 0, 0],
          customColors: { 
            primary: '#666666', 
            secondary: '#666666', 
            accent: armAccent
          } 
        },
        { 
          id: `leg-${randomLeg}-enemy`, 
          type: 'leg',
          position: [0, 0.1, 0],
          rotation: [0, 0, 0],
          customColors: { 
            primary: '#222222',
            secondary: '#1a1a1a',
            accent: '#444444'
          } 
        }
      ];
    }
    set({ enemyRobot: robot });
  },
  
  startBattle: () => set({ inBattle: true, battleLog: ['Battle started!'] }),
  
  endBattle: () => {
    // Get current state
    const state = get();
    
    // Only fully reset if both robots are still alive and have stats
    if (state.currentRobot?.stats && state.enemyRobot?.stats && 
        state.currentRobot.stats.health > 0 && state.enemyRobot.stats.health > 0) {
      set({ 
        inBattle: false, 
        enemyRobot: null, 
        battleLog: [],
        playerMove: null 
      });
    } else {
      // Just mark battle as not in progress but keep state for result screen
      set({ inBattle: false });
    }
  },

  addBattleLog: (message) => set((state) => ({ 
    battleLog: [...state.battleLog, message]
  })),
  
  calculateRobotStats: (parts) => {
    // Calculate stats based on robot parts
    let attack = 5;
    let defense = 5;
    let speed = 5;
    let health = 100;
    
    parts.forEach(part => {
      const type = part.type;
      const partName = part.id.split('-')[1];
      
      if (type === 'head') {
        if (partName === 'Battle') attack += 3;
        else if (partName === 'Scout') speed += 3;
        else health += 10; // Standard
      } 
      else if (type === 'body') {
        if (partName === 'Light') speed += 5;
        else if (partName === 'Medium') {
          health += 20;
          defense += 2;
        }
        else if (partName === 'Heavy') {
          health += 40;
          defense += 4;
          speed -= 2;
        }
      }
      else if (type === 'arm') {
        if (partName === 'Laser') attack += 5;
        else if (partName === 'Plasma') attack += 8;
        else if (partName === 'Missile') attack += 10;
      }
      else if (type === 'leg') {
        if (partName === 'Wheels') speed += 4;
        else if (partName === 'Tracks') {
          defense += 3;
          speed -= 1;
        }
        else if (partName === 'Legs') {
          attack += 2;
          speed += 2;
        }
      }
    });
    
    return { attack, defense, speed, health };
  },
  
  attackEnemy: () => {
    const { currentRobot, enemyRobot, inBattle } = get();
    
    if (!inBattle || !currentRobot || !enemyRobot || !currentRobot.stats || !enemyRobot.stats) {
      return;
    }

    const playerMove = get().playerMove;
    if (!playerMove) return;

    // Smart enemy move selection based on robot type and stats
    let enemyMove: BattleMove;
    const moves: BattleMove[] = ['laser', 'shield', 'missile'];
    const random = Math.random();

    // High defense robots prefer shield
    if (enemyRobot.stats.defense >= 10) {
      enemyMove = random < 0.6 ? 'shield' : (random < 0.8 ? 'laser' : 'missile');
    }
    // High attack robots prefer laser
    else if (enemyRobot.stats.attack >= 10) {
      enemyMove = random < 0.6 ? 'laser' : (random < 0.8 ? 'missile' : 'shield');
    }
    // High speed robots try to counter player's previous moves
    else if (enemyRobot.stats.speed >= 8) {
      // Choose move that beats the player's last move
      if (playerMove === 'laser') enemyMove = 'missile';
      else if (playerMove === 'missile') enemyMove = 'shield';
      else enemyMove = 'laser';
    }
    // Balanced robots use mixed strategy
    else {
      enemyMove = moves[Math.floor(random * moves.length)];
    }

    // Battle state updates need to be synchronous for tests
    const battleState: { log: string[], playerDamage: number, enemyDamage: number, inBattle: boolean } = {
      log: [],
      playerDamage: 20,
      enemyDamage: 15,
      inBattle: true
    };

    // Apply speed advantage - faster robot gets damage bonus
    if (currentRobot.stats.speed > enemyRobot.stats.speed) {
      battleState.playerDamage *= 1.2;
    } else if (enemyRobot.stats.speed > currentRobot.stats.speed) {
      battleState.enemyDamage *= 1.2;
    }

    // Rock-Paper-Scissors logic with move effectiveness
    if (
      (playerMove === 'laser' && enemyMove === 'shield') ||
      (playerMove === 'shield' && enemyMove === 'missile') ||
      (playerMove === 'missile' && enemyMove === 'laser')
    ) {
      battleState.playerDamage *= 1.5;
      battleState.enemyDamage *= 0.5;
      battleState.log.push(`Your ${playerMove} overpowered the enemy ${enemyMove}!`);
    } else if (
      (enemyMove === 'laser' && playerMove === 'shield') ||
      (enemyMove === 'shield' && playerMove === 'missile') ||
      (enemyMove === 'missile' && playerMove === 'laser')
    ) {
      battleState.playerDamage *= 0.5;
      battleState.enemyDamage *= 1.5;
      battleState.log.push(`Enemy's ${enemyMove} was super effective against your ${playerMove}!`);
    } else {
      battleState.log.push(`Both robots used ${playerMove}! Equal match!`);
    }

    // Apply stats modifiers with more varied formulas
    battleState.playerDamage = Math.floor(
      (battleState.playerDamage * (currentRobot.stats.attack * 1.2)) /
      (enemyRobot.stats.defense * 0.8)
    );

    battleState.enemyDamage = Math.floor(
      (battleState.enemyDamage * (enemyRobot.stats.attack * 1.2)) /
      (currentRobot.stats.defense * 0.8)
    );

    // Add randomness factor to damage (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2
    battleState.playerDamage = Math.floor(battleState.playerDamage * randomFactor);
    battleState.enemyDamage = Math.floor(battleState.enemyDamage * randomFactor);

    // Update health
    const updatedEnemyStats = {
      ...enemyRobot.stats,
      health: Math.max(0, enemyRobot.stats.health - battleState.playerDamage)
    };

    const updatedCurrentStats = {
      ...currentRobot.stats,
      health: Math.max(0, currentRobot.stats.health - battleState.enemyDamage)
    };

    battleState.log.push(
      `Your robot dealt ${battleState.playerDamage} damage!`,
      `Enemy robot dealt ${battleState.enemyDamage} damage!`
    );

    // Check for battle end
    if (updatedEnemyStats.health <= 0) {
      battleState.log.push(
        `You won the battle!`,
        `Victory! ${enemyRobot.name} was defeated!`
      );

      // Update state with all changes but keep inBattle true until result is acknowledged
      set(state => ({
        enemyRobot: { ...enemyRobot, stats: updatedEnemyStats },
        currentRobot: { ...currentRobot, stats: updatedCurrentStats },
        battleLog: battleState.log,
        inBattle: true,
        score: state.score + 100
      }));

      // Update leaderboard
      import('../services/dbService').then(({ dbService }) => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentRobot) return;
        
        dbService.updateLeaderboard(
          get().score,
          currentUser.id.toString(),
          currentUser.displayName || currentUser.username,
          currentRobot.id
        );
      }).catch(err => console.error('Failed to update leaderboard:', err));
    } else if (updatedCurrentStats.health <= 0) {
      battleState.log.push('You lost the battle!');

      // Update state with all changes but keep inBattle true until result is acknowledged
      set({
        enemyRobot: { ...enemyRobot, stats: updatedEnemyStats },
        currentRobot: { ...currentRobot, stats: updatedCurrentStats },
        battleLog: battleState.log,
        inBattle: true
      });
    } else {
      // Battle continues
      set({
        enemyRobot: { ...enemyRobot, stats: updatedEnemyStats },
        currentRobot: { ...currentRobot, stats: updatedCurrentStats },
        battleLog: battleState.log
      });
    }
  },

  setPlayerMove: (move: BattleMove) => {
    set({ playerMove: move });
    get().attackEnemy();
  },
  
  saveRobot: async (name) => {
    const { robotParts, calculateRobotStats, savedRobots } = get();
    if (robotParts.length === 0) return;
    
    // Import cloud service dynamically
    const { cloudService } = await import('../services/cloudService');
    
    // Check for existing robot with same name
    const existingRobot = savedRobots.find(robot => robot.name === name);
    
    // Create robot with stats
    const robot: Robot = {
      id: existingRobot?.id || Date.now().toString(),
      name: name || `Robot-${Date.now()}`,
      parts: [...robotParts],
      stats: calculateRobotStats(robotParts)
    };
    
    // Save to cloud/local storage
    await cloudService.saveRobot({
      ...robot,
      score: get().score
    });
    
    // Update saved robots list
    await get().loadSavedRobots();
  },
  
  loadSavedRobots: async () => {
    // Import cloud service dynamically
    const { cloudService } = await import('../services/cloudService');
    
    try {
      // Use the new getAllRobots function
      const robots = await cloudService.getAllRobots();
      
      // Ensure each robot has stats
      const robotsWithStats = robots.map(robot => ({
        ...robot,
        stats: robot.stats || get().calculateRobotStats(robot.parts)
      }));
      
      set({ savedRobots: robotsWithStats });
      console.log('Loaded saved robots:', robotsWithStats.length);
    } catch (error) {
      console.error('Failed to load robots:', error);
      set({ savedRobots: [] });
    }
  },

  loadRobot: async (robotId: string) => {
    try {
      const { cloudService } = await import('../services/cloudService');
      const robot = await cloudService.loadRobot(robotId);
      
      if (robot) {
        // Clear existing parts and load saved parts
        set({ robotParts: robot.parts });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load robot:', error);
      return false;
    }
  },

  deleteRobot: async (robotId: string) => {
    try {
      const { cloudService } = await import('../services/cloudService');
      await cloudService.deleteRobot(robotId);
      
      // Refresh the saved robots list
      await get().loadSavedRobots();
      return true;
    } catch (error) {
      console.error('Failed to delete robot:', error);
      return false;
    }
  },

  loadPlayerScore: async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const { leaderboardApi } = await import('../services/leaderboardApi');
      const entries = await leaderboardApi.getPlayerEntries(currentUser.id.toString());
      
      if (entries && entries.length > 0) {
        // Get the highest score entry
        const highestScore = Math.max(...entries.map(entry => entry.score));
        set({ score: highestScore });
      }
    } catch (error) {
      console.error('Failed to load player score:', error);
    }
  },
}))