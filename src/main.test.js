// src/main.test.js
const request = require('supertest');
const app = require('./main'); // pārliecinies, ka main.js eksportē Express app

describe('CI/CD Symphony App', () => {
  test('Main route should serve HTML', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('<html'); // vai kādu citu HTML elementu
  });

  test('API status endpoint should return JSON with status ok', async () => {
    const response = await request(app).get('/api/status');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('Healthz endpoint should respond with OK for Docker healthcheck', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  test('Health check endpoint should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
  });
  
  test('Application should handle 404 gracefully', async () => {
    await request(app)
      .get('/non-existent-route')
      .expect(404);
  });
});