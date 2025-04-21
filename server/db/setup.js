import mysql from 'mysql2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

// Get database config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'roboverse',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true // This allows running multiple SQL statements at once
};

async function setupDatabase() {
  console.log('Starting database setup...');
  
  // Create connection
  const connection = mysql.createConnection(dbConfig);
  
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, 'init.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL script
    console.log('Executing SQL initialization script...');
    connection.query(sqlScript, (err, results) => {
      if (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
      }
      
      console.log('Database setup completed successfully!');
      console.log('The leaderboard table has been created with initial test data.');
      connection.end();
    });
  } catch (error) {
    console.error('Failed to set up database:', error);
    connection.end();
    process.exit(1);
  }
}

// Run the setup
setupDatabase();