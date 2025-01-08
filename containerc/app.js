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

// Routes
app.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, created_at FROM names ORDER BY created_at DESC'
    );
    
    const rows = result.rows.map(row => ({
      ...row,
      created_at: new Date(row.created_at).toLocaleString()
    }));

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Name List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .delete-btn { 
              background: #dc3545; 
              color: white; 
              border: none; 
              padding: 5px 10px; 
              cursor: pointer; 
              border-radius: 3px;
            }
            a { color: #007bff; text-decoration: none; }
          </style>
          <script>
            function deleteName(id) {
              fetch('/delete/' + id, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    window.location.href = '/deleted?count=' + data.remainingCount;
                  }
                })
                .catch(error => console.error('Error:', error));
            }
          </script>
        </head>
        <body>
          <h1>Name List</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td>${row.id}</td>
                  <td>${row.first_name}</td>
                  <td>${row.last_name}</td>
                  <td>${row.created_at}</td>
                  <td>
                    <button onclick="deleteName(${row.id})" class="delete-btn">x</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Internal server error');
  }
});

app.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM names WHERE id = $1', [id]);
    const result = await pool.query('SELECT COUNT(*) FROM names');
    const remainingCount = result.rows[0].count;
    
    res.json({ success: true, remainingCount });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false });
  }
});

app.get('/deleted', (req, res) => {
  const count = req.query.count || 0;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Record Deleted</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          a { color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>Record Deleted</h1>
        <p>Remaining records in database: ${count}</p>
        <p><a href="/">Back to list</a></p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Service C running on port ${PORT}`);
});
