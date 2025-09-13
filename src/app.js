// For browser compatibility, load classes from global scope if available
const MetricsCollector = (typeof window !== 'undefined' && window.MetricsCollector) || 
                         require('./metrics').MetricsCollector;
const Utils = (typeof window !== 'undefined' && window.Utils) || 
              require('./utils').Utils;

/**
 * Main application class for CI/CD Symphony
 */
class CICDSymphony {
    constructor() {
        this.metrics = new MetricsCollector();
        this.utils = new Utils();
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        console.log('🎼 CI/CD Symphony inicializējas...');
        this.loadMetrics();
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * Load metrics from API or local storage
     */
    async loadMetrics() {
        try {
            const data = await this.metrics.fetchLatestMetrics();
            this.updateMetricsDisplay(data);
        } catch (error) {
            console.error('Kļūda ielādējot metriku:', error);
            this.showError('Nevarēja ielādēt metriku datus');
        }
    }

    /**
     * Update metrics display in UI
     * @param {Object} data - Metrics data
     */
    updateMetricsDisplay(data) {
        const performanceEl = document.getElementById('performance');
        const coverageEl = document.getElementById('coverage');
        const bundleSizeEl = document.getElementById('bundleSize');

        if (performanceEl) performanceEl.textContent = data.performance + '%';
        if (coverageEl) coverageEl.textContent = data.coverage + '%';
        if (bundleSizeEl) bundleSizeEl.textContent = this.utils.formatBytes(data.bundleSize);

        this.updateBadges(data);
    }

    /**
     * Update status badges
     * @param {Object} data - Metrics data
     */
    updateBadges(data) {
        const perfBadge = document.getElementById('performanceBadge');
        const covBadge = document.getElementById('coverageBadge');
        const bundleBadge = document.getElementById('bundleBadge');

        if (perfBadge) {
            const perfColor = data.performance >= 90 ? 'green' : data.performance >= 70 ? 'yellow' : 'red';
            perfBadge.src = `https://img.shields.io/badge/Performance-${data.performance}%25-${perfColor}`;
        }

        if (covBadge) {
            const covColor = data.coverage >= 80 ? 'green' : data.coverage >= 60 ? 'yellow' : 'red';
            covBadge.src = `https://img.shields.io/badge/Coverage-${data.coverage}%25-${covColor}`;
        }

        if (bundleBadge) {
            const sizeKB = Math.round(data.bundleSize / 1024);
            const bundleColor = sizeKB <= 100 ? 'green' : sizeKB <= 250 ? 'yellow' : 'red';
            bundleBadge.src = `https://img.shields.io/badge/Bundle-${sizeKB}KB-${bundleColor}`;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Global functions for HTML onclick handlers
        window.runAnalysis = () => this.runAnalysis();
        window.showHistory = () => this.showHistory();
        window.exportData = () => this.exportData();
    }

    /**
     * Run new analysis
     */
    async runAnalysis() {
        console.log('🔄 Palaidz jaunu analīzi...');
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
            resultsEl.innerHTML = '<p>⏳ Notiek analīze...</p>';
        }

        try {
            const results = await this.metrics.runAnalysis();
            this.displayResults(results);
        } catch (error) {
            console.error('Analīzes kļūda:', error);
            this.showError('Analīzes kļūda');
        }
    }

    /**
     * Show historical data
     */
    async showHistory() {
        console.log('📊 Rāda vēstures datus...');
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
            const history = await this.metrics.getHistory();
            resultsEl.innerHTML = this.formatHistoryTable(history);
        }
    }

    /**
     * Export data
     */
    async exportData() {
        console.log('📥 Eksportē datus...');
        const data = await this.metrics.getCurrentData();
        this.utils.downloadJSON(data, 'ci-cd-metrics.json');
    }

    /**
     * Display analysis results
     * @param {Object} results - Analysis results
     */
    displayResults(results) {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
            resultsEl.innerHTML = `
                <h3>✅ Analīze pabeigta</h3>
                <pre id="analysis-json"></pre>
            `;
            // Safe insertion of JSON string
            const pre = document.getElementById('analysis-json');
            if (pre) pre.textContent = JSON.stringify(results, null, 2);
        }
        this.updateMetricsDisplay(results);
    }

    /**
     * Format history table
     * @param {Array} history - Historical data
     * @returns {string} HTML table
     */
    formatHistoryTable(history) {
        if (!history || history.length === 0) {
            return '<p>Nav vēstures datu</p>';
        }

        let table = `
            <h3>📊 Metriku Vēsture</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.2);">
                        <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">Datums</th>
                        <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">Performance</th>
                        <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">Coverage</th>
                        <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">Bundle Size</th>
                    </tr>
                </thead>
                <tbody>
        `;

        history.forEach(entry => {
            table += `
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">${entry.date}</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">${entry.performance}%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">${entry.coverage}%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.3);">${this.utils.formatBytes(entry.bundleSize)}</td>
                </tr>
            `;
        });

        table += '</tbody></table>';
        return table;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
            resultsEl.innerHTML = `<p style="color: #ff6b6b;">❌ ${message}</p>`;
        }
    }

    /**
     * Update UI with current state
     */
    updateUI() {
        console.log('🎨 UI atjaunots');
    }
}

// Initialize the application when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new CICDSymphony();
    });
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CICDSymphony;
} else {
    // Make available globally in browser
    window.CICDSymphony = CICDSymphony;
}
