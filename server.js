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
  const data = usersData[userId] || { 
    coins: 0,
    stars: 0,
    level: 1,
    avatarStyle: {},
    caughtStars: 0,
    caughtSuperStars: 0,
    username: 'Player',
    customNickname: null,
    lastNicknameChange: 0
  };
  res.json(data);
});

// Обновить счёт
app.post('/api/update-score', (req, res) => {
  const { 
    userId, 
    username, 
    coins = 0,
    stars = 0,
    level = 1,
    avatarStyle = {},
    caughtStars = 0,
    caughtSuperStars = 0
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Сохраняем ВСЁ
  usersData[userId] = { 
    coins, 
    stars, 
    level, 
    avatarStyle, 
    caughtStars, 
    caughtSuperStars,
    username,
    // Сохраняем и существующие поля ника
    customNickname: usersData[userId]?.customNickname || null,
    lastNicknameChange: usersData[userId]?.lastNicknameChange || 0
  };

  // Обновляем лидерборд
  let player = leaderboard.find(p => p.id === userId);
  if (player) {
    Object.assign(player, { coins, name: username, avatarStyle, level });
  } else {
    leaderboard.push({ id: userId, name: username, coins, avatarStyle, level });
  }

  leaderboard.sort((a, b) => b.coins - a.coins);
  if (leaderboard.length > 100) leaderboard = leaderboard.slice(0, 100);

  res.json({ success: true });
});

// ✅ ОТДЕЛЬНЫЙ эндпоинт для смены ника (НЕ внутри update-score!)
app.post('/api/update-nickname', (req, res) => {
  const { userId, newNick } = req.body;
  
  if (!userId || !newNick) {
    return res.status(400).json({ error: 'Missing data' });
  }
  
  // Базовая валидация
  if (newNick.length < 3 || newNick.length > 16 || /^\d+$/.test(newNick) || /[<>{}[\]]/.test(newNick)) {
    return res.status(400).json({ error: 'Invalid nickname' });
  }
  
  // Проверка: не менял ли сегодня
  const user = usersData[userId] || {};
  const lastChange = user.lastNicknameChange || 0;
  if (Date.now() - lastChange < 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: 'Can change once per 24 hours' });
  }
  
  // Обновляем
  usersData[userId] = {
    ...user,
    customNickname: newNick,
    lastNicknameChange: Date.now(),
    // Сохраняем остальные данные
    username: newNick // чтобы лидерборд обновился
  };
  
  // Обновляем в лидерборде
  const player = leaderboard.find(p => p.id === userId);
  if (player) {
    player.name = newNick;
  }
  
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
