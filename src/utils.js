/**
 * Utility functions for CI/CD Symphony
 */
class Utils {
    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted size
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Download data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - Filename
     */
    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = filename || 'data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    /**
     * Calculate percentage change
     * @param {number} oldValue - Old value
     * @param {number} newValue - New value
     * @returns {number} Percentage change
     */
    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Generate color based on score
     * @param {number} score - Score (0-100)
     * @param {boolean} inverse - Whether lower is better
     * @returns {string} Color code
     */
    getScoreColor(score, inverse = false) {
        if (inverse) {
            if (score <= 50) return '#4caf50'; // green
            if (score <= 80) return '#ff9800'; // orange
            return '#f44336'; // red
        } else {
            if (score >= 90) return '#4caf50'; // green
            if (score >= 70) return '#ff9800'; // orange
            return '#f44336'; // red
        }
    }

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} Debounced function
     */
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Format timestamp to readable date
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted date
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('lv-LV', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Check if running in CI environment
     * @returns {boolean} Is CI environment
     */
    isCI() {
        return !!(
            process.env.CI ||
            process.env.CONTINUOUS_INTEGRATION ||
            process.env.BUILD_NUMBER ||
            process.env.GITHUB_ACTIONS ||
            process.env.GITLAB_CI ||
            process.env.CIRCLECI ||
            process.env.TRAVIS
        );
    }

    /**
     * Get environment variables safely
     * @param {string} key - Environment variable key
     * @param {string} defaultValue - Default value
     * @returns {string} Environment variable value
     */
    getEnv(key, defaultValue = '') {
        return process.env[key] || defaultValue;
    }
}

module.exports = { Utils };