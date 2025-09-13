const request = require('supertest');
const app = require('../src/main');

describe('CI/CD Symphony App', () => {
  test('Health check endpoint should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
  });
  
  test('Main route should serve HTML', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.type).toBe('text/html');
  });
  
  test('Application should handle 404 gracefully', async () => {
    await request(app)
      .get('/non-existent-route')
      .expect(404);
  });
});