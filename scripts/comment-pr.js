#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * PR Comment generator for CI/CD results
 */
class PRCommentator {
    constructor() {
        this.reportsDir = path.join(__dirname, '../reports');
        this.badgesDir = path.join(__dirname, '../badges');
        this.githubToken = process.env.GITHUB_TOKEN;
        this.repository = process.env.GITHUB_REPOSITORY;
        this.prNumber = process.env.GITHUB_EVENT_NUMBER || process.env.PR_NUMBER;
        this.runId = process.env.GITHUB_RUN_ID;
        
        if (!this.githubToken) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }
        
        if (!this.repository) {
            throw new Error('GITHUB_REPOSITORY environment variable is required');
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
     * Load badges data
     */
    loadBadges() {
        const badgesPath = path.join(this.badgesDir, 'output.json');
        
        if (!fs.existsSync(badgesPath)) {
            console.warn('Badges not found. Generating badges first...');
            try {
                const BadgeGenerator = require('./generate-badges.js');
                const generator = new BadgeGenerator();
                generator.run();
                return JSON.parse(fs.readFileSync(badgesPath, 'utf8'));
            } catch (error) {
                console.warn('Could not generate badges:', error.message);
                return null;
            }
        }
        
        return JSON.parse(fs.readFileSync(badgesPath, 'utf8'));
    }

    /**
     * Generate PR comment content
     */
    generateComment(results, badges) {
        console.log('💬 Ģenerē PR komentāru...');
        
        const timestamp = new Date(results.timestamp).toLocaleString('lv-LV');
        const commit = results.commit.substring(0, 7);
        const runUrl = `https://github.com/${this.repository}/actions/runs/${this.runId}`;
        
        let comment = `## 🎼 CI/CD Symphony Results\n\n`;
        comment += `**Commit:** \`${commit}\` | **Time:** ${timestamp} | **Run:** [#${this.runId}](${runUrl})\n\n`;

        // Add badges if available
        if (badges && badges.badges) {
            comment += `### 📊 Metrics Overview\n\n`;
            
            const badgeTypes = ['status', 'performance', 'coverage', 'bundleSize'];
            const availableBadges = badgeTypes.filter(type => badges.badges[type]);
            
            if (availableBadges.length > 0) {
                availableBadges.forEach(type => {
                    comment += `${badges.badges[type].markdown} `;
                });
                comment += `\n\n`;
            }
        }

        // Detailed results table
        comment += `### 📋 Detailed Results\n\n`;
        comment += `| Metric | Current | Previous | Change | Status |\n`;
        comment += `|--------|---------|----------|--------|--------|\n`;

        // Performance
        if (results.performance && typeof results.performance.performance === 'number') {
            const current = `${results.performance.performance}%`;
            const change = this.formatChange(results.comparison?.changes?.performance);
            const status = this.getStatusEmoji(results.performance.performance, 90, 70);
            comment += `| 🚀 Performance | ${current} | - | ${change} | ${status} |\n`;
        }

        // Coverage
        if (results.coverage && typeof results.coverage.total === 'number') {
            const current = `${results.coverage.total}%`;
            const change = this.formatChange(results.comparison?.changes?.coverage);
            const status = this.getStatusEmoji(results.coverage.total, 80, 60);
            comment += `| 🛡️ Coverage | ${current} | - | ${change} | ${status} |\n`;
        }

        // Bundle Size
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const current = this.formatBytes(results.bundleSize.total);
            const change = this.formatSizeChange(results.comparison?.changes?.bundleSize);
            const sizeKB = Math.round(results.bundleSize.total / 1024);
            const status = this.getBundleStatusEmoji(sizeKB);
            comment += `| 📦 Bundle Size | ${current} | - | ${change} | ${status} |\n`;
        }

        // Performance breakdown
        if (results.performance && results.performance.metrics) {
            comment += `\n### 🚀 Performance Breakdown\n\n`;
            comment += `| Metric | Value | Threshold | Status |\n`;
            comment += `|--------|-------|-----------|--------|\n`;
            
            const metrics = results.performance.metrics;
            
            if (metrics.firstContentfulPaint) {
                const fcp = `${metrics.firstContentfulPaint}ms`;
                const status = metrics.firstContentfulPaint <= 1800 ? '✅' : '⚠️';
                comment += `| First Contentful Paint | ${fcp} | ≤ 1.8s | ${status} |\n`;
            }
            
            if (metrics.largestContentfulPaint) {
                const lcp = `${metrics.largestContentfulPaint}ms`;
                const status = metrics.largestContentfulPaint <= 2500 ? '✅' : '⚠️';
                comment += `| Largest Contentful Paint | ${lcp} | ≤ 2.5s | ${status} |\n`;
            }
            
            if (metrics.cumulativeLayoutShift !== undefined) {
                const cls = metrics.cumulativeLayoutShift.toFixed(3);
                const status = metrics.cumulativeLayoutShift <= 0.1 ? '✅' : '⚠️';
                comment += `| Cumulative Layout Shift | ${cls} | ≤ 0.1 | ${status} |\n`;
            }
            
            if (metrics.totalBlockingTime) {
                const tbt = `${metrics.totalBlockingTime}ms`;
                const status = metrics.totalBlockingTime <= 200 ? '✅' : '⚠️';
                comment += `| Total Blocking Time | ${tbt} | ≤ 200ms | ${status} |\n`;
            }
        }

        // Coverage breakdown
        if (results.coverage && results.coverage.statements !== undefined) {
            comment += `\n### 🛡️ Coverage Breakdown\n\n`;
            comment += `| Type | Coverage | Status |\n`;
            comment += `|------|----------|--------|\n`;
            
            const types = [
                { name: 'Statements', value: results.coverage.statements },
                { name: 'Branches', value: results.coverage.branches },
                { name: 'Functions', value: results.coverage.functions },
                { name: 'Lines', value: results.coverage.lines }
            ];
            
            types.forEach(type => {
                if (type.value !== undefined) {
                    const status = this.getStatusEmoji(type.value, 80, 60);
                    comment += `| ${type.name} | ${type.value}% | ${status} |\n`;
                }
            });
        }

        // Bundle breakdown
        if (results.bundleSize && results.bundleSize.breakdown) {
            comment += `\n### 📦 Bundle Breakdown\n\n`;
            comment += `| Type | Size | Percentage |\n`;
            comment += `|------|------|------------|\n`;
            
            const breakdown = results.bundleSize.breakdown;
            const total = results.bundleSize.total;
            
            Object.entries(breakdown).forEach(([type, size]) => {
                const percentage = ((size / total) * 100).toFixed(1);
                comment += `| ${type.toUpperCase()} | ${this.formatBytes(size)} | ${percentage}% |\n`;
            });
        }

        // Recommendations
        comment += this.generateRecommendations(results);

        // Footer
        comment += `\n---\n`;
        comment += `<details>\n`;
        comment += `<summary>🔧 Technical Details</summary>\n\n`;
        comment += `- **Branch:** \`${results.branch}\`\n`;
        comment += `- **Commit:** \`${results.commit}\`\n`;
        comment += `- **Analysis Time:** ${timestamp}\n`;
        comment += `- **Status:** ${results.status}\n`;
        if (this.runId) {
            comment += `- **GitHub Actions Run:** [View Details](${runUrl})\n`;
        }
        comment += `\n</details>\n\n`;
        comment += `*Generated by CI/CD Symphony 🎼*`;

        return comment;
    }

    /**
     * Generate recommendations based on results
     */
    generateRecommendations(results) {
        const recommendations = [];

        // Performance recommendations
        if (results.performance && results.performance.performance < 70) {
            recommendations.push('🚀 **Performance:** Optimize images, enable compression, and minimize JavaScript bundles');
        }

        if (results.performance && results.performance.metrics) {
            const metrics = results.performance.metrics;
            
            if (metrics.firstContentfulPaint > 1800) {
                recommendations.push('⚡ **FCP:** Reduce server response time and optimize critical rendering path');
            }
            
            if (metrics.largestContentfulPaint > 2500) {
                recommendations.push('🖼️ **LCP:** Optimize your largest page element (images, videos, or text blocks)');
            }
            
            if (metrics.cumulativeLayoutShift > 0.1) {
                recommendations.push('📐 **CLS:** Add size attributes to images and videos, avoid inserting content above existing content');
            }
            
            if (metrics.totalBlockingTime > 200) {
                recommendations.push('⏱️ **TBT:** Break up long JavaScript tasks and remove unused JavaScript');
            }
        }

        // Coverage recommendations
        if (results.coverage && results.coverage.total < 60) {
            recommendations.push('🛡️ **Coverage:** Add more unit tests to improve code coverage and reliability');
        }

        // Bundle size recommendations
        if (results.bundleSize) {
            const sizeKB = Math.round(results.bundleSize.total / 1024);
            
            if (sizeKB > 500) {
                recommendations.push('📦 **Bundle Size:** Consider code splitting, tree shaking, and removing unused dependencies');
            }
            
            if (results.bundleSize.breakdown && results.bundleSize.breakdown.js > results.bundleSize.total * 0.7) {
                recommendations.push('📜 **JavaScript:** Large JS bundle detected. Consider lazy loading and code splitting');
            }
        }

        if (recommendations.length === 0) {
            return `\n### ✅ Great Job!\n\nAll metrics are looking good! Keep up the excellent work.\n`;
        }

        let section = `\n### 💡 Recommendations\n\n`;
        recommendations.forEach(rec => {
            section += `- ${rec}\n`;
        });
        
        return section;
    }

    /**
     * Format change indicator
     */
    formatChange(change) {
        if (typeof change !== 'number') return '-';
        
        const sign = change > 0 ? '+' : '';
        const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
        
        if (Math.abs(change) < 1) return '➖';
        
        return `${sign}${change.toFixed(1)}% ${emoji}`;
    }

    /**
     * Format size change indicator
     */
    formatSizeChange(change) {
        if (typeof change !== 'number') return '-';
        
        const sign = change > 0 ? '+' : '';
        const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
        
        if (Math.abs(change) < 1024) return '➖'; // Less than 1KB change
        
        return `${sign}${this.formatBytes(Math.abs(change))} ${emoji}`;
    }

    /**
     * Get status emoji based on score
     */
    getStatusEmoji(score, goodThreshold, warningThreshold) {
        if (score >= goodThreshold) return '✅';
        if (score >= warningThreshold) return '⚠️';
        return '❌';
    }

    /**
     * Get bundle size status emoji
     */
    getBundleStatusEmoji(sizeKB) {
        if (sizeKB <= 100) return '✅';
        if (sizeKB <= 250) return '⚠️';
        return '❌';
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Make GitHub API request
     */
    async makeGitHubRequest(method, path, data) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                port: 443,
                path,
                method,
                headers: {
                    'Authorization': `Bearer ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CI-CD-Symphony/1.0.0',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`GitHub API error: ${res.statusCode} - ${response.message || body}`));
                        }
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${body}`));
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Find existing comment
     */
    async findExistingComment() {
        if (!this.prNumber) return null;

        try {
            const comments = await this.makeGitHubRequest(
                'GET',
                `/repos/${this.repository}/issues/${this.prNumber}/comments`
            );

            return comments.find(comment => 
                comment.body.includes('🎼 CI/CD Symphony Results') &&
                comment.user.login === 'github-actions[bot]'
            );
        } catch (error) {
            console.warn('Could not fetch existing comments:', error.message);
            return null;
        }
    }

    /**
     * Post comment to PR
     */
    async postComment(comment) {
        if (!this.prNumber) {
            console.log('No PR number found, skipping comment posting');
            return;
        }

        try {
            // Check for existing comment
            const existingComment = await this.findExistingComment();

            if (existingComment) {
                console.log(`Updating existing comment ${existingComment.id}...`);
                
                await this.makeGitHubRequest(
                    'PATCH',
                    `/repos/${this.repository}/issues/comments/${existingComment.id}`,
                    { body: comment }
                );
                
                console.log('✅ Existing comment updated successfully');
            } else {
                console.log('Creating new comment...');
                
                await this.makeGitHubRequest(
                    'POST',
                    `/repos/${this.repository}/issues/${this.prNumber}/comments`,
                    { body: comment }
                );
                
                console.log('✅ New comment posted successfully');
            }
        } catch (error) {
            console.error('❌ Failed to post/update comment:', error.message);
            throw error;
        }
    }

    /**
     * Run PR commenting
     */
    async run() {
        console.log('💬 PR Commentator sākas...');
        console.log(`📋 Repository: ${this.repository}`);
        console.log(`🔀 PR Number: ${this.prNumber || 'N/A'}`);
        
        try {
            const results = this.loadResults();
            const badges = this.loadBadges();
            const comment = this.generateComment(results, badges);
            
            // Save comment for debugging
            const commentPath = path.join(this.reportsDir, 'pr-comment.md');
            fs.writeFileSync(commentPath, comment);
            console.log(`💾 Comment saved to ${commentPath}`);
            
            await this.postComment(comment);
            
            console.log('🎉 PR komentēšana pabeigta!');
            
        } catch (error) {
            console.error('❌ PR komentēšanas kļūda:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const commentator = new PRCommentator();
    commentator.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = PRCommentator;