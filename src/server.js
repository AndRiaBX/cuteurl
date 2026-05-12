const express = require('express');
const path = require('path');
const { initDb } = require('./db');
const { router } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', router);

async function start() {
  await initDb();
}

if (require.main === module) {
  start().then(() => {
    app.listen(PORT, () => {
      console.log(`[cuteurl] Server running at http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

module.exports = { app };
