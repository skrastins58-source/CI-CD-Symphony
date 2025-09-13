#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Slack notification sender for CI/CD results
 */
class SlackNotifier {
    constructor() {
        this.reportsDir = path.join(__dirname, '../reports');
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
        this.channel = process.env.SLACK_CHANNEL || '#ci-cd';
        this.username = process.env.SLACK_USERNAME || 'CI/CD Symphony';
        this.iconEmoji = process.env.SLACK_ICON || ':musical_note:';
        this.repository = process.env.GITHUB_REPOSITORY;
        this.runId = process.env.GITHUB_RUN_ID;
        this.actor = process.env.GITHUB_ACTOR;
        
        if (!this.webhookUrl) {
            throw new Error('SLACK_WEBHOOK_URL environment variable is required');
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
     * Determine overall status
     */
    getOverallStatus(results) {
        let score = 0;
        let total = 0;

        // Check performance (weight: 30%)
        if (results.performance && typeof results.performance.performance === 'number') {
            score += (results.performance.performance / 100) * 30;
            total += 30;
        }

        // Check coverage (weight: 40%)
        if (results.coverage && typeof results.coverage.total === 'number') {
            score += (results.coverage.total / 100) * 40;
            total += 40;
        }

        // Check bundle size (weight: 30%) - inverse scoring
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const sizeKB = Math.round(results.bundleSize.total / 1024);
            let sizeScore = 100;
            
            if (sizeKB > 500) sizeScore = 20;
            else if (sizeKB > 250) sizeScore = 60;
            else if (sizeKB > 100) sizeScore = 85;
            
            score += (sizeScore / 100) * 30;
            total += 30;
        }

        if (total === 0) return { status: 'unknown', score: 0, color: '#808080' };

        const finalScore = (score / total) * 100;

        if (finalScore >= 85) {
            return { status: 'excellent', score: finalScore, color: '#36a64f' }; // green
        } else if (finalScore >= 70) {
            return { status: 'good', score: finalScore, color: '#ffaa00' }; // yellow
        } else if (finalScore >= 50) {
            return { status: 'warning', score: finalScore, color: '#ff6600' }; // orange
        } else {
            return { status: 'critical', score: finalScore, color: '#ff0000' }; // red
        }
    }

    /**
     * Get status emoji
     */
    getStatusEmoji(status) {
        const emojis = {
            excellent: ':white_check_mark:',
            good: ':large_yellow_circle:',
            warning: ':warning:',
            critical: ':x:',
            unknown: ':question:'
        };
        return emojis[status] || ':question:';
    }

    /**
     * Get trend emoji
     */
    getTrendEmoji(change, inverse = false) {
        if (typeof change !== 'number' || Math.abs(change) < 1) {
            return ':heavy_minus_sign:'; // no significant change
        }
        
        if (inverse) {
            // For bundle size, smaller is better
            return change > 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';
        } else {
            // For performance/coverage, higher is better
            return change > 0 ? ':chart_with_upwards_trend:' : ':chart_with_downwards_trend:';
        }
    }

    /**
     * Format file size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Create Slack message blocks
     */
    createSlackBlocks(results, overallStatus) {
        const timestamp = new Date(results.timestamp).toLocaleString('lv-LV');
        const commit = results.commit.substring(0, 7);
        const runUrl = `https://github.com/${this.repository}/actions/runs/${this.runId}`;
        const repoUrl = `https://github.com/${this.repository}`;
        
        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🎼 CI/CD Symphony Results`,
                    emoji: true
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Repository:* <${repoUrl}|${this.repository}>\n*Status:* ${this.getStatusEmoji(overallStatus.status)} ${overallStatus.status.toUpperCase()} (${overallStatus.score.toFixed(1)}%)\n*Commit:* \`${commit}\` by ${this.actor}\n*Time:* ${timestamp}`
                }
            }
        ];

        // Add action buttons
        if (this.runId) {
            blocks.push({
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'View Details',
                            emoji: true
                        },
                        url: runUrl,
                        style: 'primary'
                    }
                ]
            });
        }

        // Metrics section
        const metricsFields = [];

        if (results.performance && typeof results.performance.performance === 'number') {
            const trend = this.getTrendEmoji(results.comparison?.changes?.performance);
            metricsFields.push({
                type: 'mrkdwn',
                text: `*🚀 Performance*\n${results.performance.performance}% ${trend}`
            });
        }

        if (results.coverage && typeof results.coverage.total === 'number') {
            const trend = this.getTrendEmoji(results.comparison?.changes?.coverage);
            metricsFields.push({
                type: 'mrkdwn',
                text: `*🛡️ Coverage*\n${results.coverage.total}% ${trend}`
            });
        }

        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const trend = this.getTrendEmoji(results.comparison?.changes?.bundleSize, true);
            metricsFields.push({
                type: 'mrkdwn',
                text: `*📦 Bundle Size*\n${this.formatBytes(results.bundleSize.total)} ${trend}`
            });
        }

        if (metricsFields.length > 0) {
            blocks.push({
                type: 'section',
                fields: metricsFields
            });
        }

        // Add detailed breakdown for critical issues
        if (overallStatus.status === 'critical' || overallStatus.status === 'warning') {
            const issues = this.getIssues(results);
            
            if (issues.length > 0) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*:warning: Issues Found:*\n${issues.map(issue => `• ${issue}`).join('\n')}`
                    }
                });
            }
        }

        // Add performance details if available
        if (results.performance && results.performance.metrics) {
            const perfDetails = [];
            const metrics = results.performance.metrics;
            
            if (metrics.firstContentfulPaint) {
                const status = metrics.firstContentfulPaint <= 1800 ? ':white_check_mark:' : ':warning:';
                perfDetails.push(`FCP: ${metrics.firstContentfulPaint}ms ${status}`);
            }
            
            if (metrics.largestContentfulPaint) {
                const status = metrics.largestContentfulPaint <= 2500 ? ':white_check_mark:' : ':warning:';
                perfDetails.push(`LCP: ${metrics.largestContentfulPaint}ms ${status}`);
            }
            
            if (perfDetails.length > 0) {
                blocks.push({
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: perfDetails.join(' | ')
                        }
                    ]
                });
            }
        }

        return blocks;
    }

    /**
     * Get list of issues
     */
    getIssues(results) {
        const issues = [];

        // Performance issues
        if (results.performance && results.performance.performance < 70) {
            issues.push('Performance score below 70%');
        }

        if (results.performance && results.performance.metrics) {
            const metrics = results.performance.metrics;
            
            if (metrics.firstContentfulPaint > 2000) {
                issues.push('Slow First Contentful Paint (>2s)');
            }
            
            if (metrics.largestContentfulPaint > 3000) {
                issues.push('Slow Largest Contentful Paint (>3s)');
            }
            
            if (metrics.cumulativeLayoutShift > 0.15) {
                issues.push('High Cumulative Layout Shift');
            }
        }

        // Coverage issues
        if (results.coverage && results.coverage.total < 60) {
            issues.push('Code coverage below 60%');
        }

        // Bundle size issues
        if (results.bundleSize) {
            const sizeKB = Math.round(results.bundleSize.total / 1024);
            if (sizeKB > 500) {
                issues.push(`Large bundle size (${sizeKB}KB)`);
            }
        }

        return issues;
    }

    /**
     * Create simple text message for fallback
     */
    createSimpleMessage(results, overallStatus) {
        const timestamp = new Date(results.timestamp).toLocaleString('lv-LV');
        const commit = results.commit.substring(0, 7);
        const emoji = this.getStatusEmoji(overallStatus.status);
        
        let message = `🎼 CI/CD Symphony Results ${emoji}\n\n`;
        message += `Repository: ${this.repository}\n`;
        message += `Status: ${overallStatus.status.toUpperCase()} (${overallStatus.score.toFixed(1)}%)\n`;
        message += `Commit: ${commit} by ${this.actor}\n`;
        message += `Time: ${timestamp}\n\n`;

        message += `Metrics:\n`;
        
        if (results.performance && typeof results.performance.performance === 'number') {
            message += `🚀 Performance: ${results.performance.performance}%\n`;
        }
        
        if (results.coverage && typeof results.coverage.total === 'number') {
            message += `🛡️ Coverage: ${results.coverage.total}%\n`;
        }
        
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            message += `📦 Bundle Size: ${this.formatBytes(results.bundleSize.total)}\n`;
        }

        if (this.runId) {
            const runUrl = `https://github.com/${this.repository}/actions/runs/${this.runId}`;
            message += `\nView details: ${runUrl}`;
        }

        return message;
    }

    /**
     * Send Slack message
     */
    async sendSlackMessage(payload) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const url = new URL(this.webhookUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(body);
                    } else {
                        reject(new Error(`Slack webhook failed: ${res.statusCode} - ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    /**
     * Should send notification based on conditions
     */
    shouldSendNotification(results, overallStatus) {
        // Always send if status is critical
        if (overallStatus.status === 'critical') return true;
        
        // Send if there are significant changes
        if (results.comparison && results.comparison.changes) {
            const changes = results.comparison.changes;
            
            // Significant performance drop
            if (changes.performance && changes.performance < -10) return true;
            
            // Significant coverage drop
            if (changes.coverage && changes.coverage < -10) return true;
            
            // Significant bundle size increase (>20%)
            if (changes.bundleSize && changes.bundleSize > results.bundleSize.total * 0.2) return true;
        }
        
        // Send based on environment variable
        const alwaysSend = process.env.SLACK_ALWAYS_SEND === 'true';
        const onlyFailures = process.env.SLACK_ONLY_FAILURES === 'true';
        
        if (alwaysSend) return true;
        if (onlyFailures && overallStatus.status !== 'excellent') return true;
        
        // Default: send for warnings and critical
        return overallStatus.status === 'warning' || overallStatus.status === 'critical';
    }

    /**
     * Run Slack notification
     */
    async run() {
        console.log('💬 Slack Notifier sākas...');
        console.log(`📢 Channel: ${this.channel}`);
        
        try {
            const results = this.loadResults();
            const overallStatus = this.getOverallStatus(results);
            
            console.log(`📊 Overall Status: ${overallStatus.status} (${overallStatus.score.toFixed(1)}%)`);
            
            if (!this.shouldSendNotification(results, overallStatus)) {
                console.log('ℹ️ Notification skipped based on conditions');
                return;
            }
            
            const blocks = this.createSlackBlocks(results, overallStatus);
            const fallbackText = this.createSimpleMessage(results, overallStatus);
            
            const payload = {
                channel: this.channel,
                username: this.username,
                icon_emoji: this.iconEmoji,
                text: fallbackText,
                blocks: blocks,
                unfurl_links: false,
                unfurl_media: false
            };

            // Save payload for debugging
            const payloadPath = path.join(this.reportsDir, 'slack-payload.json');
            fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
            console.log(`💾 Payload saved to ${payloadPath}`);
            
            await this.sendSlackMessage(payload);
            
            console.log('✅ Slack ziņa nosūtīta veiksmīgi!');
            
        } catch (error) {
            console.error('❌ Slack ziņas kļūda:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const notifier = new SlackNotifier();
    notifier.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SlackNotifier;