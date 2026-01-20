const express = require('express');
const { Pool } = require('pg');
const app = express();

// 1. 配置数据库连接（Vercel会自动用环境变量替换这里）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 2. 让服务器能处理JSON数据
app.use(express.json());

// 3. 创建抽签的API
app.post('/api/create', async (req, res) => {
  try {
    const { name, creatorName, password, teamList, groupConfig } = req.body;
    const drawId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const result = await pool.query(
      'INSERT INTO draws (id, name, creator_name, password, group_config, all_teams) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [drawId, name, creatorName, password, groupConfig, teamList]
    );
    
    res.json({ success: true, drawId: result.rows[0].id });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 4. 获取抽签详情的API
app.get('/api/draw/:id', async (req, res) => {
  try {
    const drawResult = await pool.query('SELECT * FROM draws WHERE id = $1', [req.params.id]);
    if (drawResult.rows.length === 0) return res.json({ success: false, error: 'Not found' });
    
    const participants = await pool.query('SELECT * FROM participants WHERE draw_id = $1', [req.params.id]);
    
    res.json({
      success: true,
      draw: { ...drawResult.rows[0], participants: participants.rows }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 5. 前端页面
app.use(express.static('public'));

// 6. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
module.exports = app;