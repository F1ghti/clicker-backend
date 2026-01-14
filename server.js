// server.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Явно разрешаем нужные заголовки
app.use(cors({
  origin: '*', // Можно ограничить до https://f1ghti.github.io и https://clicker-1-5vaz.onrender.com
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Токен бота
const BOT_TOKEN = '8331253569:AAGv7W3WRCbYbGyA5xbz2ZM_DdEgi9mUDWk';

let leaderboard = [];

// Проверка данных Telegram
function verifyData(initData) {
  if (!initData) return null;
  const searchParams = new URLSearchParams(initData);
  const hash = searchParams.get('hash');
  if (!hash) return null;

  searchParams.delete('hash');
  const dataCheckString = Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  return computedHash === hash ? Object.fromEntries(searchParams) : null;
}

// Эндпоинт обновления счёта
app.post('/api/update-score', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('❌ No Authorization header');
    return res.status(401).json({ error: 'No auth header' });
  }

  const payload = verifyData(authHeader);
  if (!payload || !payload.user) {
    console.log('❌ Invalid initData:', authHeader);
    return res.status(403).json({ error: 'Invalid auth data' });
  }

  try {
    const user = JSON.parse(decodeURIComponent(payload.user));
    const coins = parseInt(req.body.coins) || 0;

    let player = leaderboard.find(p => p.id === user.id);
    if (player) {
      if (coins > player.coins) player.coins = coins;
    } else {
      leaderboard.push({
        id: user.id,
        name: user.username || user.first_name || 'Player',
        coins
      });
    }

    leaderboard.sort((a, b) => b.coins - a.coins);
    if (leaderboard.length > 100) leaderboard = leaderboard.slice(0, 100);

    console.log('✅ Сохранён игрок:', user.id, coins);
    res.json({ success: true });
  } catch (e) {
    console.error('💥 Ошибка парсинга:', e.message);
    res.status(500).json({ error: 'Parse error' });
  }
});

// Эндпоинт лидеров
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

// Обязательно: убираем маршрут "/"
// Express по умолчанию не создаёт "Welcome to Express", если нет app.get('/')

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
