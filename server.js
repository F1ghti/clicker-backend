// server.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = '8331253569:AAGv7W3WRCbYbGyA5xbz2ZM_DdEgi9mUDWk';

let leaderboard = [];

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

  if (computedHash !== hash) return null;
  return Object.fromEntries(searchParams);
}

app.post('/api/update-score', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No auth header' });
  }

  const payload = verifyData(authHeader);
  if (!payload || !payload.user) {
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

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Parse error' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
