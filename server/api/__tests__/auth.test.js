import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockExecute = jest.fn();
const mockPool = {
  execute: mockExecute
};

// Mock mysql2/promise module
jest.unstable_mockModule('mysql2/promise', () => ({
  default: {
    createPool: () => mockPool
  }
}));

const authRoutes = (await import('../auth.js')).default;

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth API', () => {
  beforeEach(() => {
    mockExecute.mockClear();
  });

  describe('POST /auth/login', () => {
    it('should return user data on successful login', async () => {
      const mockUser = {
        id: 3,
        username: 'testuser',
        display_name: 'Test User',
        created_at: '2025-04-14T20:22:22.000Z',
        is_guest: 0
      };

      mockExecute.mockResolvedValueOnce([[mockUser]]); // Find user query
      mockExecute.mockResolvedValueOnce([{}]); // Update last login query

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          displayName: mockUser.display_name,
          createdAt: mockUser.created_at,
          isGuest: false
        }
      });
    });

    it('should return 401 with invalid credentials', async () => {
      mockExecute.mockResolvedValueOnce([[]]); // No user found

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid username or password'
      });
    });

    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Username and password are required'
      });
    });

    it('should handle guest user login correctly', async () => {
      const mockGuestUser = {
        id: 4,
        username: 'guest_12345',
        display_name: 'Guest Player',
        created_at: '2025-04-14T20:22:22.000Z',
        is_guest: 1
      };

      mockExecute.mockResolvedValueOnce([[mockGuestUser]]); // Find user query
      mockExecute.mockResolvedValueOnce([{}]); // Update last login query

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'guest_12345', password: 'guest_12345' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        user: {
          id: mockGuestUser.id,
          username: mockGuestUser.username,
          displayName: mockGuestUser.display_name,
          createdAt: mockGuestUser.created_at,
          isGuest: true
        }
      });
    });
  });

  describe('POST /auth/register', () => {
    it('should create new user and return success with user data', async () => {
      const newUser = {
        username: 'newuser',
        password: 'password',
        displayName: 'New User'
      };

      mockExecute.mockResolvedValueOnce([[]]); // Check existing user
      mockExecute.mockResolvedValueOnce([{ insertId: 4 }]); // Insert user
      
      // Mock the user fetch after creation
      mockExecute.mockResolvedValueOnce([[{
        id: 4,
        username: 'newuser',
        display_name: 'New User',
        created_at: '2025-04-14T20:22:22.000Z',
        is_guest: 0
      }]]);

      const response = await request(app)
        .post('/auth/register')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Registration successful',
        user: {
          id: 4,
          username: 'newuser',
          displayName: 'New User',
          createdAt: expect.any(String),
          isGuest: false
        }
      });
    });

    it('should return 409 if username already exists', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          password: 'password'
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: 'Username already exists'
      });
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    });

    it('should create guest account with correct flags', async () => {
      const guestUser = {
        username: 'guest_12345',
        password: 'guest_12345',
        displayName: 'Guest Player',
        isGuest: true
      };

      mockExecute.mockResolvedValueOnce([[]]); // Check existing user
      mockExecute.mockResolvedValueOnce([{ insertId: 5 }]); // Insert user
      
      // Mock the user fetch after creation
      mockExecute.mockResolvedValueOnce([[{
        id: 5,
        username: 'guest_12345',
        display_name: 'Guest Player',
        created_at: '2025-04-14T20:22:22.000Z',
        is_guest: 1
      }]]);

      const response = await request(app)
        .post('/auth/register')
        .send(guestUser);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Registration successful',
        user: {
          id: 5,
          username: 'guest_12345',
          displayName: 'Guest Player',
          createdAt: expect.any(String),
          isGuest: true
        }
      });
    });
  });
});