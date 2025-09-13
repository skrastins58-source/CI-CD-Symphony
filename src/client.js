// Frontend client application
console.log('🎼 CI/CD Symphony Client Loaded');

// Simple client-side functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  // Add some interactive behavior
  const features = document.querySelectorAll('.feature');
  features.forEach(feature => {
    feature.addEventListener('click', function() {
      feature.style.transform = feature.style.transform === 'scale(1.05)' ? 'scale(1)' : 'scale(1.05)';
    });
  });
  
  // Check health endpoint
  checkHealth();
});

async function checkHealth() {
  try {
    const response = await fetch('/health');
    const data = await response.json();
    console.log('Health check:', data);
  } catch (error) {
    console.log('Health check failed (expected in static mode):', error.message);
  }
}

// Export for module support
export { checkHealth };