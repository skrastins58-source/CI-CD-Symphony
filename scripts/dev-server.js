#!/usr/bin/env node

/**
 * CI/CD Symphony - Development Server
 * Local development server with hot reload capabilities
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔥 Starting CI/CD Symphony Development Server...');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

function startServer() {
  try {
    // Ensure dist/main.js exists
    if (!fs.existsSync('dist/main.js')) {
      console.log('📦 Building application first...');
      require('./build.js');
    }

    console.log(`🚀 Starting server on http://${HOST}:${PORT}`);
    console.log('📊 Metrics dashboard will be available at http://localhost:3000');
    console.log('🔄 Server will auto-reload on file changes');
    
    // Start the main application
    const server = spawn('node', ['dist/main.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT }
    });

    server.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(1);
      }
    });

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      server.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      server.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  }
}

startServer();