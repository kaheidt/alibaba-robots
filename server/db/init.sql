-- Initialization script for Alibaba Robots database

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS alibaba_robots;

-- Use the database
USE alibaba_robots;

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  score INT NOT NULL,
  robot_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Add an index for faster lookups by player_id
  INDEX idx_player_id (player_id),
  
  -- Add a unique constraint to ensure one entry per player
  -- If you want to allow multiple entries per player, remove this constraint
  UNIQUE KEY unique_player (player_id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_guest BOOLEAN DEFAULT FALSE,
  
  -- Add indices for faster lookups
  UNIQUE INDEX idx_username (username),
  INDEX idx_created_at (created_at)
);

-- Add some initial data for testing (optional)
INSERT IGNORE INTO leaderboard (player_id, player_name, score, robot_id)
VALUES 
  ('p1', 'Robot Master', 5000, 'robot001'),
  ('p2', 'Battle Droid', 4500, 'robot002'),
  ('p3', 'Mech Warrior', 4200, 'robot003'),
  ('p4', 'Iron Giant', 3800, 'robot004'),
  ('p5', 'Steel Samurai', 3500, 'robot005');

-- Create any other necessary tables here

-- Grant privileges if needed (adjust according to your security requirements)
-- GRANT ALL PRIVILEGES ON alibaba_robots.* TO 'your_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;