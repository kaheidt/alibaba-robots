import express from 'express';
import mysql from 'mysql2/promise';
import { createHash } from 'crypto';

const router = express.Router();

// Create a connection pool
let pool;
try {
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
  console.log('Auth database connection pool created');
} catch (error) {
  console.error('Failed to create auth database connection pool:', error);
}

// Hash password
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('hex');
};

// Validate password
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

// Get user by ID
const getUserById = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, username, display_name, created_at, is_guest
     FROM users
     WHERE id = ?`,
    [userId]
  );
  
  if (rows.length === 0) return null;
  
  const user = rows[0];
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    createdAt: user.created_at,
    isGuest: user.is_guest === 1
  };
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable'
      });
    }

    const { username, password, displayName, isGuest = false } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Validate password unless it's a guest account
    if (!isGuest) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({
          success: false,
          error: passwordError
        });
      }
    }

    // Check if username already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Create new user
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, display_name, is_guest)
       VALUES (?, ?, ?, ?)`,
      [username, hashPassword(password), displayName || username, isGuest]
    );

    // Get the created user
    const newUser = await getUserById(result.insertId);

    return res.json({
      success: true,
      message: 'Registration successful',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable'
      });
    }

    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user and verify password
    const [rows] = await pool.execute(
      `SELECT id, username, display_name, created_at, is_guest
       FROM users
       WHERE username = ? AND password_hash = ?`,
      [username, hashPassword(password)]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = rows[0];

    // Update last login time
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
        isGuest: user.is_guest === 1
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Update profile
router.put('/profile/:userId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable'
      });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Filter allowed updates
    const allowedUpdates = ['display_name'];
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => allowedUpdates.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    const query = `UPDATE users SET ${
      Object.keys(filteredUpdates)
        .map(key => `${key} = ?`)
        .join(', ')
    } WHERE id = ?`;

    const values = [...Object.values(filteredUpdates), userId];

    await pool.execute(query, values);

    // Get updated user
    const updatedUser = await getUserById(userId);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

export default router;