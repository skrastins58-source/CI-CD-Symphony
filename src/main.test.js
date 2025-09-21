// src/main.test.js
const request = require('supertest');
const app = require('../main'); // pārliecinies, ka main.js eksportē Express app

describe('CI/CD Symphony App', () => {
  test('Main route should serve HTML', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('<html'); // vai kādu citu HTML elementu
  });
});
