const express = require('express');
const cors = require('cors');
const path = require('path');
const { router } = require('./routes');

function createApp({ staticRoot } = {}) {
  const app = express();

  const allowed = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
  app.use(cors({
    origin: allowed ? allowed.split(',').map((s) => s.trim()) : true,
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', router);

  if (staticRoot) {
    app.use(express.static(staticRoot));
    app.get('/', (_req, res) => res.redirect('/?mode=app'));
  }

  return app;
}

module.exports = { createApp };
