// app.js
const express = require('express');
const { Pool } = require('pg');
const app = express();

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.use(express.urlencoded({ extended: true }));

// Create table if it doesn't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS names (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(first_name, last_name)
      );
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Name Entry Form</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          form { max-width: 400px; }
          input { margin: 10px 0; padding: 5px; width: 100%; }
          button { padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Enter Name</h1>
        <form method="POST" action="/submit">
          <div>
            <label for="firstName">First Name:</label>
            <input type="text" id="firstName" name="firstName" required>
          </div>
          <div>
            <label for="lastName">Last Name:</label>
            <input type="text" id="lastName" name="lastName" required>
          </div>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  const { firstName, lastName } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO names (first_name, last_name) VALUES ($1, $2)',
      [firstName, lastName]
    );
    
    const result = await pool.query('SELECT COUNT(*) FROM names');
    const count = result.rows[0].count;
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Success</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            a { color: #007bff; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>Success!</h1>
          <p>Total records in database: ${count}</p>
          <p><a href="/">Enter another name</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    if (err.code === '23505') { // Unique violation error code
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              a { color: #007bff; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>Error</h1>
            <p>Name already exists!</p>
            <p><a href="/">Enter another name</a></p>
          </body>
        </html>
      `);
    } else {
      console.error('Database error:', err);
      res.status(500).send('Internal server error');
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service B running on port ${PORT}`);
});
