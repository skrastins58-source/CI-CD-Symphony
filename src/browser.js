// Browser entry point for webpack
const { MetricsCollector } = require('./metrics');
const { Utils } = require('./utils');

// Make classes available globally for the main app
window.MetricsCollector = MetricsCollector;
window.Utils = Utils;

// Import and initialize the main app
const CICDSymphony = require('./app');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CICDSymphony();
});