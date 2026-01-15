const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

let leaderboard = [];
let usersData = {};

// Получить данные игрока
app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const data = usersData[userId] || { coins: 0 };
  res.json(data);
});

// Обновить счёт
app.post('/api/update-score', (req, res) => {
  const { userId, username, coins } = req.body;
  if (!userId || coins == null) {
    return res.status(400).json({ error: 'Missing data' });
  }

  // Сохраняем данные
  usersData[userId] = { coins, username };

  // Обновляем лидерборд
  let player = leaderboard.find(p => p.id === userId);
  if (player) {
    player.coins = coins;
    player.name = username;
  } else {
    leaderboard.push({ id: userId, name: username, coins });
  }

  leaderboard.sort((a, b) => b.coins - a.coins);
  if (leaderboard.length > 100) leaderboard = leaderboard.slice(0, 100);

  res.json({ success: true });
});

// Таблица лидеров
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
