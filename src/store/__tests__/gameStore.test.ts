import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn()
  }
}));

// Mock dbService
vi.mock('../../services/dbService', () => ({
  dbService: {
    updateLeaderboard: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('gameStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store
    useGameStore.setState({
      score: 0,
      robotParts: [],
      selectedPart: null,
      currentRobot: null,
      enemyRobot: null,
      inBattle: false,
      battleLog: [],
      savedRobots: [],
      playerMove: null
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('battle mechanics', () => {
    const mockRobot = {
      id: 'test-1',
      name: 'Test Robot',
      parts: [],
      stats: { attack: 5, defense: 5, speed: 5, health: 100 }
    };

    const mockEnemy = {
      id: 'enemy-1',
      name: 'Enemy Robot',
      parts: [],
      stats: { attack: 5, defense: 5, speed: 5, health: 100 }
    };

    it('should initialize battle state correctly', () => {
      const store = useGameStore.getState();
      store.startBattle();
      store.setCurrentRobot(mockRobot);
      store.setEnemyRobot(mockEnemy);

      const state = useGameStore.getState();
      expect(state.inBattle).toBe(true);
      expect(state.currentRobot).toEqual(mockRobot);
      expect(state.enemyRobot).toEqual(mockEnemy);
      expect(state.battleLog).toEqual(['Battle started!']);
    });

    it('should handle move effectiveness correctly', () => {
      const store = useGameStore.getState();
      store.startBattle();
      store.setCurrentRobot(mockRobot);
      store.setEnemyRobot(mockEnemy);

      // Mock Math.random to control enemy move
      const randomSpy = vi.spyOn(Math, 'random');
      randomSpy.mockReturnValue(0); // Will select 'laser' as enemy move

      // Test shield vs laser (shield should be weak)
      store.setPlayerMove('shield');
      
      const state = useGameStore.getState();
      expect(state.battleLog).toContain("Enemy's laser was super effective against your shield!");
      expect(state.currentRobot?.stats?.health).toBeLessThan(mockRobot.stats.health);
      
      randomSpy.mockRestore();
    });

    it('should end battle when a robot is defeated', async () => {
      const store = useGameStore.getState();
      store.startBattle();
      store.setCurrentRobot({
        ...mockRobot,
        stats: { ...mockRobot.stats, health: 10 }
      });
      store.setEnemyRobot(mockEnemy);

      // Mock Math.random for consistent enemy moves
      const randomSpy = vi.spyOn(Math, 'random');
      randomSpy.mockReturnValue(0);
      
      // Wait for battle initialization
      await vi.advanceTimersToNextTimerAsync();
      
      store.setPlayerMove('shield'); // Should be weak against enemy's laser

      // Wait for battle resolution
      await vi.advanceTimersToNextTimerAsync();

      const state = useGameStore.getState();
      expect(state.battleLog).toContain("Enemy's laser was super effective against your shield!");
      expect(state.battleLog).toContain('You lost the battle!');
      expect(state.inBattle).toBe(false);
      
      randomSpy.mockRestore();
    });

    it('should update leaderboard on victory', async () => {
      const mockUser = {
        id: 123,
        username: 'testuser',
        displayName: 'Test User',
        isGuest: false
      };

      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

      const store = useGameStore.getState();
      store.startBattle();
      store.setCurrentRobot(mockRobot);
      store.setEnemyRobot({
        ...mockEnemy,
        stats: { ...mockEnemy.stats, health: 10 }
      });

      // Mock Math.random for consistent enemy moves
      const randomSpy = vi.spyOn(Math, 'random');
      randomSpy.mockReturnValue(0);

      // Wait for battle initialization
      await vi.advanceTimersToNextTimerAsync();
      
      store.setPlayerMove('missile'); // Should be strong against enemy's laser

      // Wait for battle resolution
      await vi.advanceTimersToNextTimerAsync();

      const state = useGameStore.getState();
      expect(state.battleLog).toContain('Your missile overpowered the enemy laser!');
      expect(state.battleLog).toContain('You won the battle!');
      expect(state.score).toBe(100);
      
      // Wait for async leaderboard update
      await vi.runAllTimersAsync();
      
      const { dbService } = await import('../../services/dbService');
      expect(dbService.updateLeaderboard).toHaveBeenCalledWith(
        100,
        '123',
        'Test User',
        'test-1'
      );
      
      randomSpy.mockRestore();
    });
  });
});