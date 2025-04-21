import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { leaderboardApi } from '../leaderboardApi';

// Setup MSW server
const server = setupServer(
  http.post('*/api/leaderboard', () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.get('*/api/leaderboard', () => {
    return HttpResponse.json([
      { player_id: 'player2', player_name: 'Player 2', score: 300 },
      { player_id: 'player3', player_name: 'Player 3', score: 200 },
      { player_id: 'player1', player_name: 'Player 1', score: 100 }
    ]);
  }),
  
  http.get('*/api/leaderboard/player/:playerId', ({ params }) => {
    const { playerId } = params;
    if (playerId === 'player1') {
      return HttpResponse.json([
        { player_id: 'player1', player_name: 'Player 1', score: 200 },
        { player_id: 'player1', player_name: 'Player 1', score: 100 }
      ]);
    }
    return HttpResponse.json([]);
  })
);

describe('leaderboardApi', () => {
  let localStorageMock: Record<string, string>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    // Reset localStorage mock before each test
    localStorageMock = {};

    // Create a proper spy for localStorage methods
    const storage = {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: Object.keys(localStorageMock).length
    };

    // Mock the window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true
    });

    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {}  // Empty env forces localStorage mode
      }
    });

    server.resetHandlers();
  });

  describe('updateLeaderboard', () => {
    it('should store new entry in localStorage when API is not available', async () => {
      // Force localStorage mode by setting import.meta.env
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: undefined }
        }
      });
      
      const result = await leaderboardApi.updateLeaderboard(
        100,
        'player1',
        'Test Player',
        'robot1'
      );

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalled();
      
      const storedValue = window.localStorage.getItem('alibaba_robots_leaderboard');
      const storedData = JSON.parse(storedValue!);
      expect(storedData).toHaveLength(1);
      expect(storedData[0]).toMatchObject({
        player_id: 'player1',
        player_name: 'Test Player',
        score: 100,
        robot_id: 'robot1'
      });
    });

    it('should update existing entry if new score is higher', async () => {
      // Force localStorage mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: undefined }
        }
      });

      // Add initial entry with score 100
      window.localStorage.setItem('alibaba_robots_leaderboard', JSON.stringify([{
        player_id: 'player1',
        player_name: 'Test Player',
        score: 100,
        robot_id: 'robot1',
        timestamp: new Date().toISOString()
      }]));

      // Update with higher score
      const result = await leaderboardApi.updateLeaderboard(200, 'player1', 'Test Player', 'robot1');

      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalled();
      
      const storedValue = window.localStorage.getItem('alibaba_robots_leaderboard');
      const storedData = JSON.parse(storedValue!);
      expect(storedData).toHaveLength(1);
      expect(storedData[0].score).toBe(200);
    });

    it('should not update existing entry if new score is lower', async () => {
      // Force localStorage mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: undefined }
        }
      });

      // Add initial entry with score 200
      window.localStorage.setItem('alibaba_robots_leaderboard', JSON.stringify([{
        player_id: 'player1',
        player_name: 'Test Player',
        score: 200,
        robot_id: 'robot1',
        timestamp: new Date().toISOString()
      }]));

      // Try to update with lower score
      const result = await leaderboardApi.updateLeaderboard(100, 'player1', 'Test Player', 'robot1');

      expect(result).toBe(true);
      
      const storedValue = window.localStorage.getItem('alibaba_robots_leaderboard');
      const storedData = JSON.parse(storedValue!);
      expect(storedData).toHaveLength(1);
      expect(storedData[0].score).toBe(200);
    });

    it('should use API when available', async () => {
      // Enable API mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: 'http://localhost:3001/api' }
        }
      });

      const result = await leaderboardApi.updateLeaderboard(
        100,
        'player1',
        'Test Player',
        'robot1'
      );

      expect(result).toBe(true);
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should retrieve sorted entries from localStorage when API is not available', async () => {
      // Force localStorage mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: undefined }
        }
      });

      // Add multiple entries
      window.localStorage.setItem('alibaba_robots_leaderboard', JSON.stringify([
        {
          player_id: 'player1',
          player_name: 'Player 1',
          score: 100,
          robot_id: 'robot1',
          timestamp: new Date().toISOString()
        },
        {
          player_id: 'player2',
          player_name: 'Player 2',
          score: 300,
          robot_id: 'robot2',
          timestamp: new Date().toISOString()
        },
        {
          player_id: 'player3',
          player_name: 'Player 3',
          score: 200,
          robot_id: 'robot3',
          timestamp: new Date().toISOString()
        }
      ]));

      const entries = await leaderboardApi.getLeaderboard();

      expect(entries).toHaveLength(3);
      expect(entries[0].score).toBe(300);
      expect(entries[1].score).toBe(200);
      expect(entries[2].score).toBe(100);
    });

    it('should retrieve entries from API when available', async () => {
      // Enable API mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: 'http://localhost:3001/api' }
        }
      });

      const entries = await leaderboardApi.getLeaderboard(2);

      expect(entries).toHaveLength(3);
      expect(entries[0].score).toBe(300);
      expect(entries[1].score).toBe(200);
      expect(entries[2].score).toBe(100);
    });
  });

  describe('getPlayerEntries', () => {
    it('should retrieve entries for specific player from API when available', async () => {
      // Enable API mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: 'http://localhost:3001/api' }
        }
      });

      const entries = await leaderboardApi.getPlayerEntries('player1');

      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.player_id === 'player1')).toBe(true);
      expect(entries[0].score).toBe(200);
      expect(entries[1].score).toBe(100);
    });

    it('should retrieve entries from localStorage when API is not available', async () => {
      // Force localStorage mode
      vi.stubGlobal('import', {
        meta: {
          env: { VITE_API_URL: undefined }
        }
      });

      // Add entries for multiple players
      window.localStorage.setItem('alibaba_robots_leaderboard', JSON.stringify([
        {
          player_id: 'player1',
          player_name: 'Player 1',
          score: 100,
          robot_id: 'robot1',
          timestamp: new Date().toISOString()
        },
        {
          player_id: 'player2',
          player_name: 'Player 2',
          score: 300,
          robot_id: 'robot2',
          timestamp: new Date().toISOString()
        },
        {
          player_id: 'player1',
          player_name: 'Player 1',
          score: 200,
          robot_id: 'robot3',
          timestamp: new Date().toISOString()
        }
      ]));

      const entries = await leaderboardApi.getPlayerEntries('player1');

      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.player_id === 'player1')).toBe(true);
      expect(entries[0].score).toBe(200);
      expect(entries[1].score).toBe(100);
    });
  });
});