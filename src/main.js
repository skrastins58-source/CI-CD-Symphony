const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Docker healthcheck endpoint
app.get('/healthz', (req, res) => {
  res.send('OK');
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CI/CD Symphony server running on port ${PORT}`);
  });
}

module.exports = app;