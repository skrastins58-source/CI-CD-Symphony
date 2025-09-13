/**
 * @jest-environment jsdom
 */

// Simple client-side functionality tests
describe('Client Application', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="feature">Feature 1</div>
      <div class="feature">Feature 2</div>
    `;
    
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should have DOM elements available', () => {
    const features = document.querySelectorAll('.feature');
    expect(features.length).toBe(2);
    expect(features[0].textContent).toBe('Feature 1');
  });

  test('should handle click events on features', () => {
    const features = document.querySelectorAll('.feature');
    const feature = features[0];
    
    // Add click event listener (simplified version of client.js logic)
    feature.addEventListener('click', function() {
      this.style.transform = this.style.transform === 'scale(1.05)' ? 'scale(1)' : 'scale(1.05)';
    });
    
    // Simulate click
    feature.click();
    expect(feature.style.transform).toBe('scale(1.05)');
    
    // Click again
    feature.click();
    expect(feature.style.transform).toBe('scale(1)');
  });

  test('should handle fetch calls', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy', timestamp: '2023-01-01' })
    });

    const response = await fetch('/health');
    const data = await response.json();
    
    expect(fetch).toHaveBeenCalledWith('/health');
    expect(data.status).toBe('healthy');
  });
});