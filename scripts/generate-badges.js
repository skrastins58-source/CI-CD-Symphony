#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Badge generator for CI/CD metrics
 */
class BadgeGenerator {
    constructor() {
        this.reportsDir = path.join(__dirname, '../reports');
        this.badgesDir = path.join(__dirname, '../badges');
        this.ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.badgesDir)) {
            fs.mkdirSync(this.badgesDir, { recursive: true });
        }
    }

    /**
     * Load analysis results
     */
    loadResults() {
        const resultsPath = path.join(this.reportsDir, 'analysis-results.json');
        
        if (!fs.existsSync(resultsPath)) {
            throw new Error('Analysis results not found. Run analysis first.');
        }
        
        return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    /**
     * Get color based on score
     */
    getScoreColor(score, thresholds = { good: 80, warning: 60 }) {
        if (score >= thresholds.good) return 'brightgreen';
        if (score >= thresholds.warning) return 'yellow';
        return 'red';
    }

    /**
     * Get size color based on bundle size
     */
    getSizeColor(sizeKB) {
        if (sizeKB <= 100) return 'brightgreen';
        if (sizeKB <= 250) return 'yellow';
        if (sizeKB <= 500) return 'orange';
        return 'red';
    }

    /**
     * Format bytes to KB
     */
    formatToKB(bytes) {
        return Math.round(bytes / 1024);
    }

    /**
     * Generate Shields.io badge URL
     */
    generateBadgeUrl(label, message, color, style = 'flat') {
        const encodedLabel = encodeURIComponent(label);
        const encodedMessage = encodeURIComponent(message);
        return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}?style=${style}`;
    }

    /**
     * Generate SVG badge content
     */
    generateSVGBadge(label, message, color) {
        const colorMap = {
            brightgreen: '#4c1',
            green: '#97ca00',
            yellow: '#dfb317',
            orange: '#fe7d37',
            red: '#e05d44',
            blue: '#007ec6',
            lightgrey: '#9f9f9f'
        };

        const bgColor = colorMap[color] || '#9f9f9f';
        const labelWidth = label.length * 7 + 20;
        const messageWidth = message.length * 7 + 20;
        const totalWidth = labelWidth + messageWidth;

        return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
    <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
        <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
        <path fill="${bgColor}" d="M${labelWidth} 0h${messageWidth}v20H${labelWidth}z"/>
        <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="${labelWidth/2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
        <text x="${labelWidth/2}" y="14">${label}</text>
        <text x="${labelWidth + messageWidth/2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
        <text x="${labelWidth + messageWidth/2}" y="14">${message}</text>
    </g>
</svg>`.trim();
    }

    /**
     * Generate all badges
     */
    generateBadges(results) {
        console.log('🏷️ Ģenerē badge...');
        
        const badges = {};

        // Performance badge
        if (results.performance && typeof results.performance.performance === 'number') {
            const perfScore = results.performance.performance;
            const perfColor = this.getScoreColor(perfScore, { good: 90, warning: 70 });
            
            badges.performance = {
                url: this.generateBadgeUrl('Performance', `${perfScore}%`, perfColor),
                svg: this.generateSVGBadge('Performance', `${perfScore}%`, perfColor),
                markdown: `![Performance](${this.generateBadgeUrl('Performance', `${perfScore}%`, perfColor)})`,
                html: `<img src="${this.generateBadgeUrl('Performance', `${perfScore}%`, perfColor)}" alt="Performance Badge">`
            };
        }

        // Coverage badge
        if (results.coverage && typeof results.coverage.total === 'number') {
            const covScore = results.coverage.total;
            const covColor = this.getScoreColor(covScore, { good: 80, warning: 60 });
            
            badges.coverage = {
                url: this.generateBadgeUrl('Coverage', `${covScore}%`, covColor),
                svg: this.generateSVGBadge('Coverage', `${covScore}%`, covColor),
                markdown: `![Coverage](${this.generateBadgeUrl('Coverage', `${covScore}%`, covColor)})`,
                html: `<img src="${this.generateBadgeUrl('Coverage', `${covScore}%`, covColor)}" alt="Coverage Badge">`
            };
        }

        // Bundle size badge
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const sizeKB = this.formatToKB(results.bundleSize.total);
            const sizeColor = this.getSizeColor(sizeKB);
            
            badges.bundleSize = {
                url: this.generateBadgeUrl('Bundle Size', `${sizeKB}KB`, sizeColor),
                svg: this.generateSVGBadge('Bundle Size', `${sizeKB}KB`, sizeColor),
                markdown: `![Bundle Size](${this.generateBadgeUrl('Bundle Size', `${sizeKB}KB`, sizeColor)})`,
                html: `<img src="${this.generateBadgeUrl('Bundle Size', `${sizeKB}KB`, sizeColor)}" alt="Bundle Size Badge">`
            };
        }

        // Overall status badge
        const overallStatus = this.calculateOverallStatus(results);
        badges.status = {
            url: this.generateBadgeUrl('CI/CD', overallStatus.label, overallStatus.color),
            svg: this.generateSVGBadge('CI/CD', overallStatus.label, overallStatus.color),
            markdown: `![CI/CD Status](${this.generateBadgeUrl('CI/CD', overallStatus.label, overallStatus.color)})`,
            html: `<img src="${this.generateBadgeUrl('CI/CD', overallStatus.label, overallStatus.color)}" alt="CI/CD Status Badge">`
        };

        return badges;
    }

    /**
     * Calculate overall status
     */
    calculateOverallStatus(results) {
        let passing = 0;
        let total = 0;

        // Check performance
        if (results.performance && typeof results.performance.performance === 'number') {
            total++;
            if (results.performance.performance >= 70) passing++;
        }

        // Check coverage
        if (results.coverage && typeof results.coverage.total === 'number') {
            total++;
            if (results.coverage.total >= 60) passing++;
        }

        // Check bundle size (under 500KB is considered good)
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            total++;
            if (this.formatToKB(results.bundleSize.total) <= 500) passing++;
        }

        if (total === 0) {
            return { label: 'unknown', color: 'lightgrey' };
        }

        const percentage = (passing / total) * 100;
        
        if (percentage === 100) {
            return { label: 'passing', color: 'brightgreen' };
        } else if (percentage >= 67) {
            return { label: 'mostly passing', color: 'yellow' };
        } else {
            return { label: 'failing', color: 'red' };
        }
    }

    /**
     * Generate table for README
     */
    generateTable(results) {
        console.log('📋 Ģenerē tabulu...');
        
        let table = `
## 📊 CI/CD Metrics

| Metric | Value | Status | Trend |
|--------|--------|--------|--------|`;

        // Performance row
        if (results.performance && typeof results.performance.performance === 'number') {
            const perfScore = results.performance.performance;
            const perfColor = this.getScoreColor(perfScore, { good: 90, warning: 70 });
            const perfBadge = this.generateBadgeUrl('', `${perfScore}%`, perfColor);
            const trend = this.getTrendIndicator(results.comparison?.changes?.performance);
            
            table += `\n| 🚀 Performance | ${perfScore}% | ![](${perfBadge}) | ${trend} |`;
        }

        // Coverage row
        if (results.coverage && typeof results.coverage.total === 'number') {
            const covScore = results.coverage.total;
            const covColor = this.getScoreColor(covScore, { good: 80, warning: 60 });
            const covBadge = this.generateBadgeUrl('', `${covScore}%`, covColor);
            const trend = this.getTrendIndicator(results.comparison?.changes?.coverage);
            
            table += `\n| 🛡️ Coverage | ${covScore}% | ![](${covBadge}) | ${trend} |`;
        }

        // Bundle size row
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const sizeKB = this.formatToKB(results.bundleSize.total);
            const sizeColor = this.getSizeColor(sizeKB);
            const sizeBadge = this.generateBadgeUrl('', `${sizeKB}KB`, sizeColor);
            const trend = this.getTrendIndicator(results.comparison?.changes?.bundleSize, true);
            
            table += `\n| 📦 Bundle Size | ${sizeKB}KB | ![](${sizeBadge}) | ${trend} |`;
        }

        table += `\n\n*Last updated: ${new Date(results.timestamp).toLocaleString('lv-LV')}*`;
        
        return table;
    }

    /**
     * Get trend indicator
     */
    getTrendIndicator(change, inverse = false) {
        if (typeof change !== 'number') return '➖';
        
        if (Math.abs(change) < 1) return '➖'; // No significant change
        
        if (inverse) {
            // For bundle size, smaller is better
            return change > 0 ? '📈' : '📉';
        } else {
            // For performance/coverage, higher is better
            return change > 0 ? '📈' : '📉';
        }
    }

    /**
     * Generate API endpoints data
     */
    generateAPI(results) {
        console.log('🔌 Ģenerē API datus...');
        
        const api = {
            version: '1.0.0',
            generated: results.timestamp,
            endpoints: {
                '/api/metrics': {
                    method: 'GET',
                    description: 'Get current metrics',
                    response: {
                        performance: results.performance?.performance || null,
                        coverage: results.coverage?.total || null,
                        bundleSize: results.bundleSize?.total || null,
                        timestamp: results.timestamp
                    }
                },
                '/api/badges/performance': {
                    method: 'GET',
                    description: 'Get performance badge',
                    response: 'SVG badge'
                },
                '/api/badges/coverage': {
                    method: 'GET',
                    description: 'Get coverage badge',
                    response: 'SVG badge'
                },
                '/api/badges/bundle-size': {
                    method: 'GET',
                    description: 'Get bundle size badge',
                    response: 'SVG badge'
                },
                '/api/history': {
                    method: 'GET',
                    description: 'Get metrics history',
                    response: 'Array of historical metrics'
                }
            }
        };

        return api;
    }

    /**
     * Save all generated content
     */
    saveAll(badges, table, api) {
        console.log('💾 Saglabā visus ģenerētos failus...');
        
        // Save badges
        fs.writeFileSync(
            path.join(this.badgesDir, 'badges.json'), 
            JSON.stringify(badges, null, 2)
        );

        // Save individual SVG badges
        Object.keys(badges).forEach(key => {
            if (badges[key].svg) {
                fs.writeFileSync(
                    path.join(this.badgesDir, `${key}.svg`),
                    badges[key].svg
                );
            }
        });

        // Save table
        fs.writeFileSync(
            path.join(this.badgesDir, 'table.md'),
            table
        );

        // Save API data
        fs.writeFileSync(
            path.join(this.badgesDir, 'api.json'),
            JSON.stringify(api, null, 2)
        );

        // Save combined output
        const output = {
            badges,
            table,
            api,
            generated: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(this.badgesDir, 'output.json'),
            JSON.stringify(output, null, 2)
        );

        console.log('✅ Visi faili saglabāti badges/ direktorijā');
    }

    /**
     * Run badge generation
     */
    run() {
        console.log('🏷️ Badge Generator sākas...');
        
        try {
            const results = this.loadResults();
            const badges = this.generateBadges(results);
            const table = this.generateTable(results);
            const api = this.generateAPI(results);
            
            this.saveAll(badges, table, api);
            
            // Output for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                const output = JSON.stringify({ badges, table, api });
                fs.appendFileSync(
                    process.env.GITHUB_OUTPUT || '/dev/null',
                    `badges<<EOF\n${output}\nEOF\n`
                );
            }
            
            console.log('🎉 Badge ģenerēšana pabeigta!');
            console.log('📂 Rezultāti pieejami badges/ direktorijā');
            
        } catch (error) {
            console.error('❌ Badge ģenerēšanas kļūda:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new BadgeGenerator();
    generator.run();
}

module.exports = BadgeGenerator;