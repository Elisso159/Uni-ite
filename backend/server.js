const express = require('express');
const mysql = require('mysql2/promise');

const app = express(); 
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '703d1bed99E!', 
  database: 'unibite_db',
  waitForConnections: true,
  connectionLimit: 10
});


async function getTotalPortionsLastMonth(pool) {
  const query = `
    SELECT COALESCE(SUM(f.food_portion), 0) AS total_portions
    FROM food f
    JOIN requests r ON f.food_id = r.req_food_id
    WHERE f.food_status = 'FINISHED' 
      AND f.food_timestamp >= NOW() - INTERVAL 1 MONTH;
  `;
  const [rows] = await pool.query(query);
  return rows[0].total_portions;
}

async function getTopDonor(pool) {
  const query = `
    SELECT s.st_id, s.st_name, s.st_surname, s.st_email, COALESCE(SUM(f.food_portion), 0) AS total_donated_portions
    FROM student s
    JOIN cook c ON s.st_id = c.cook_st_id
    JOIN food f ON c.cook_id = f.food_cook_id
    WHERE f.food_status = 'FINISHED'
    GROUP BY s.st_id, s.st_name, s.st_surname, s.st_email
    ORDER BY total_donated_portions DESC
    LIMIT 1;
  `;
  const [rows] = await pool.query(query);
  return rows[0] || null;
}

async function getTopMeals(pool) {
  const query = `
    SELECT f.food_id, f.food_title, f.food_portion, COUNT(r.req_id) AS total_requests
    FROM food f
    JOIN requests r ON f.food_id = r.req_food_id
    WHERE f.food_status = 'FINISHED'
    GROUP BY f.food_id, f.food_title, f.food_portion
    ORDER BY total_requests DESC
    LIMIT 5;
  `;
  const [rows] = await pool.query(query);
  return rows;
}

app.get('/api/admin/stats/monthly-portions', async (req, res) => {
  try {
    const totalPortions = await getTotalPortionsLastMonth(pool);
    res.json({ success: true, totalPortionsLastMonth: totalPortions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/leaderboard', async (req, res) => {
  try {
    const topDonor = await getTopDonor(pool);
    const topMeals = await getTopMeals(pool);
    res.json({ success: true, leaderboard: { topDonor, topMeals } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Εκκίνηση Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});