require('dotenv').config();
const path = require('path');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3456;
const dist = path.join(__dirname, '..', 'dist');
const app = createApp({ staticRoot: dist });

app.listen(PORT, () => {
  console.log(`SnapSpend API at http://localhost:${PORT}`);
  console.log(`  Web (after build): http://localhost:${PORT}/`);
  console.log(`  Dev frontend:      npm run dev:web → http://localhost:5173`);
});
