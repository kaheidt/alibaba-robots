import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Create a connection pool
let pool;
try {
  // Use environment variables for DB connection
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword', // Updated to use rootpassword as default
    database: process.env.DB_NAME || 'alibaba_robots',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    enableKeepAlive: true
  });
  console.log('Database connection pool created');
} catch (error) {
  console.error('Failed to create database connection pool:', error);
}

// Check if the database is accessible
router.get('/health', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ status: 'error', message: 'Database connection not available' });
    }
    
    // Try a simple query to check connection
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', message: 'Database connection is healthy' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Database health check failed',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Get leaderboard entries
router.get('/leaderboard', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ 
        error: 'Database service unavailable',
        message: 'Using fallback data source'
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    
    // Get top scores
    const [rows] = await pool.query(`
      SELECT 
        id, 
        player_id, 
        player_name, 
        score, 
        robot_id, 
        timestamp 
      FROM leaderboard 
      ORDER BY score DESC 
      LIMIT ?
    `, [limit]);
    
    return res.json(rows);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

// Get entries for a specific player
router.get('/leaderboard/player/:playerId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ 
        error: 'Database service unavailable',
        message: 'Using fallback data source'
      });
    }
    
    const { playerId } = req.params;
    
    // Get player's scores
    const [rows] = await pool.query(`
      SELECT 
        id, 
        player_id, 
        player_name, 
        score, 
        robot_id, 
        timestamp 
      FROM leaderboard 
      WHERE player_id = ?
      ORDER BY score DESC
    `, [playerId]);
    
    return res.json(rows);
  } catch (error) {
    console.error(`Failed to fetch player ${req.params.playerId} entries:`, error);
    return res.status(500).json({ 
      error: 'Failed to fetch player entries',
      message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

// Add or update a leaderboard entry
router.post('/leaderboard', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ 
        error: 'Database service unavailable',
        message: 'Using fallback data storage'
      });
    }
    
    const { player_id, player_name, score, robot_id } = req.body;
    
    // Validate required fields
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }
    
    if (typeof score !== 'number' || isNaN(score)) {
      return res.status(400).json({ error: 'score must be a valid number' });
    }
    
    // Check if the player already has an entry
    const [existingRows] = await pool.query(
      'SELECT id, score FROM leaderboard WHERE player_id = ?', 
      [player_id]
    );
    
    if (existingRows.length > 0) {
      // Player exists, update if new score is higher
      const existingEntry = existingRows[0];
      
      if (score > existingEntry.score) {
        await pool.query(
          `UPDATE leaderboard 
           SET score = ?, player_name = ?, robot_id = ?, timestamp = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [score, player_name || null, robot_id || null, existingEntry.id]
        );
        return res.json({ 
          success: true, 
          message: 'Leaderboard entry updated',
          updated: true
        });
      } else {
        // Score is not higher, don't update
        return res.json({ 
          success: true,
          message: 'Existing score is higher',
          updated: false
        });
      }
    } else {
      // No existing entry, insert new one
      await pool.query(
        `INSERT INTO leaderboard (player_id, player_name, score, robot_id) 
         VALUES (?, ?, ?, ?)`,

        [player_id, player_name || null, score, robot_id || null]
      );
      
      return res.json({ 
        success: true, 
        message: 'Leaderboard entry created',
        updated: true
      });
    }
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
    return res.status(500).json({ 
      error: 'Failed to update leaderboard',
      message: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
    });
  }
});

export default router;