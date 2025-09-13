// CI/CD Symphony - Main Application Entry Point
// This is a sample application demonstrating the CI/CD pipeline capabilities

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// API endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    message: 'CI/CD Symphony Metrics API',
    endpoints: [
      '/health',
      '/api/metrics',
      '/api/status'
    ],
    performance: {
      lighthouse: 95,
      coverage: 87.36,
      bundleSize: '245KB'
    }
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      database: 'connected',
      cache: 'connected',
      monitoring: 'active'
    },
    lastDeployment: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CI/CD Symphony</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
          .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
          .metric h3 { margin: 0 0 10px 0; color: #666; }
          .metric .value { font-size: 24px; font-weight: bold; color: #007acc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎼 CI/CD Symphony</h1>
          <div class="status">
            <strong>Status:</strong> ✅ Operational | <strong>Version:</strong> ${process.env.npm_package_version || '1.0.0'}
          </div>
          <div class="metrics">
            <div class="metric">
              <h3>Lighthouse Score</h3>
              <div class="value">95</div>
            </div>
            <div class="metric">
              <h3>Test Coverage</h3>
              <div class="value">87%</div>
            </div>
            <div class="metric">
              <h3>Bundle Size</h3>
              <div class="value">245KB</div>
            </div>
          </div>
          <p><strong>Endpoints:</strong></p>
          <ul>
            <li><a href="/health">/health</a> - Health check</li>
            <li><a href="/api/metrics">/api/metrics</a> - Metrics API</li>
            <li><a href="/api/status">/api/status</a> - Status API</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎼 CI/CD Symphony running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Metrics API:  http://localhost:${PORT}/api/metrics`);
  });
}

module.exports = app;