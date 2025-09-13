#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Baseline updater for CI/CD metrics
 */
class BaselineUpdater {
    constructor() {
        this.reportsDir = path.join(__dirname, '../reports');
        this.baselineDir = path.join(__dirname, '../baselines');
        this.ensureDirectories();
        
        this.isMainBranch = this.checkIfMainBranch();
        this.isMergeEvent = process.env.GITHUB_EVENT_NAME === 'push';
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.baselineDir)) {
            fs.mkdirSync(this.baselineDir, { recursive: true });
        }
    }

    /**
     * Check if current branch is main/master
     */
    checkIfMainBranch() {
        const branch = process.env.GITHUB_REF_NAME || '';
        const mainBranches = ['main', 'master', 'develop'];
        return mainBranches.includes(branch.toLowerCase());
    }

    /**
     * Load current analysis results
     */
    loadCurrentResults() {
        const resultsPath = path.join(this.reportsDir, 'analysis-results.json');
        
        if (!fs.existsSync(resultsPath)) {
            throw new Error('Analysis results not found. Run analysis first.');
        }
        
        return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    /**
     * Load existing baseline
     */
    loadBaseline() {
        const baselinePath = path.join(this.baselineDir, 'metrics.json');
        
        if (!fs.existsSync(baselinePath)) {
            return null;
        }
        
        try {
            return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        } catch (error) {
            console.warn('Could not parse existing baseline:', error.message);
            return null;
        }
    }

    /**
     * Load baseline history
     */
    loadHistory() {
        const historyPath = path.join(this.baselineDir, 'history.json');
        
        if (!fs.existsSync(historyPath)) {
            return [];
        }
        
        try {
            return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch (error) {
            console.warn('Could not parse baseline history:', error.message);
            return [];
        }
    }

    /**
     * Calculate metrics delta
     */
    calculateDelta(current, baseline) {
        if (!baseline) return null;

        const delta = {
            performance: null,
            coverage: null,
            bundleSize: null,
            timestamp: current.timestamp,
            commit: current.commit
        };

        // Performance delta
        if (current.performance && baseline.performance && 
            typeof current.performance.performance === 'number' && 
            typeof baseline.performance.performance === 'number') {
            delta.performance = {
                current: current.performance.performance,
                baseline: baseline.performance.performance,
                change: current.performance.performance - baseline.performance.performance,
                changePercent: ((current.performance.performance - baseline.performance.performance) / baseline.performance.performance) * 100
            };
        }

        // Coverage delta
        if (current.coverage && baseline.coverage && 
            typeof current.coverage.total === 'number' && 
            typeof baseline.coverage.total === 'number') {
            delta.coverage = {
                current: current.coverage.total,
                baseline: baseline.coverage.total,
                change: current.coverage.total - baseline.coverage.total,
                changePercent: ((current.coverage.total - baseline.coverage.total) / baseline.coverage.total) * 100
            };
        }

        // Bundle size delta
        if (current.bundleSize && baseline.bundleSize && 
            typeof current.bundleSize.total === 'number' && 
            typeof baseline.bundleSize.total === 'number') {
            delta.bundleSize = {
                current: current.bundleSize.total,
                baseline: baseline.bundleSize.total,
                change: current.bundleSize.total - baseline.bundleSize.total,
                changePercent: ((current.bundleSize.total - baseline.bundleSize.total) / baseline.bundleSize.total) * 100
            };
        }

        return delta;
    }

    /**
     * Check if metrics are acceptable for baseline update
     */
    isAcceptableForBaseline(results) {
        const criteria = {
            performance: {
                min: 70,
                weight: 30
            },
            coverage: {
                min: 60,
                weight: 40
            },
            bundleSize: {
                maxKB: 1000, // 1MB max
                weight: 30
            }
        };

        let score = 0;
        let totalWeight = 0;
        const issues = [];

        // Check performance
        if (results.performance && typeof results.performance.performance === 'number') {
            const perf = results.performance.performance;
            if (perf >= criteria.performance.min) {
                score += criteria.performance.weight;
            } else {
                issues.push(`Performance too low: ${perf}% (min: ${criteria.performance.min}%)`);
            }
            totalWeight += criteria.performance.weight;
        }

        // Check coverage
        if (results.coverage && typeof results.coverage.total === 'number') {
            const cov = results.coverage.total;
            if (cov >= criteria.coverage.min) {
                score += criteria.coverage.weight;
            } else {
                issues.push(`Coverage too low: ${cov}% (min: ${criteria.coverage.min}%)`);
            }
            totalWeight += criteria.coverage.weight;
        }

        // Check bundle size
        if (results.bundleSize && typeof results.bundleSize.total === 'number') {
            const sizeKB = Math.round(results.bundleSize.total / 1024);
            if (sizeKB <= criteria.bundleSize.maxKB) {
                score += criteria.bundleSize.weight;
            } else {
                issues.push(`Bundle too large: ${sizeKB}KB (max: ${criteria.bundleSize.maxKB}KB)`);
            }
            totalWeight += criteria.bundleSize.weight;
        }

        const percentage = totalWeight > 0 ? (score / totalWeight) * 100 : 0;
        const acceptable = percentage >= 70; // At least 70% of criteria must pass

        return {
            acceptable,
            score: percentage,
            issues,
            criteria
        };
    }

    /**
     * Create new baseline
     */
    createBaseline(results, delta) {
        const baseline = {
            version: '1.0.0',
            created: new Date().toISOString(),
            commit: results.commit,
            branch: results.branch,
            performance: results.performance,
            coverage: results.coverage,
            bundleSize: results.bundleSize,
            metadata: {
                creator: process.env.GITHUB_ACTOR || 'automated',
                repository: process.env.GITHUB_REPOSITORY,
                workflow: process.env.GITHUB_WORKFLOW,
                runId: process.env.GITHUB_RUN_ID
            }
        };

        if (delta) {
            baseline.delta = delta;
        }

        return baseline;
    }

    /**
     * Update history
     */
    updateHistory(baseline, results) {
        let history = this.loadHistory();
        
        // Add current baseline to history
        history.push({
            timestamp: baseline.created,
            commit: baseline.commit,
            branch: baseline.branch,
            performance: baseline.performance?.performance || null,
            coverage: baseline.coverage?.total || null,
            bundleSize: baseline.bundleSize?.total || null,
            metadata: {
                actor: baseline.metadata.creator,
                runId: baseline.metadata.runId
            }
        });

        // Keep only last 50 entries
        if (history.length > 50) {
            history = history.slice(-50);
        }

        return history;
    }

    /**
     * Generate trend analysis
     */
    generateTrendAnalysis(history) {
        if (history.length < 2) {
            return { trend: 'insufficient_data', message: 'Need at least 2 data points for trend analysis' };
        }

        const recent = history.slice(-5); // Last 5 entries
        const analysis = {
            performance: this.analyzeTrend(recent.map(h => h.performance).filter(p => p !== null)),
            coverage: this.analyzeTrend(recent.map(h => h.coverage).filter(c => c !== null)),
            bundleSize: this.analyzeTrend(recent.map(h => h.bundleSize).filter(b => b !== null), true)
        };

        return analysis;
    }

    /**
     * Analyze trend for a metric
     */
    analyzeTrend(values, inverse = false) {
        if (values.length < 2) return { trend: 'insufficient_data' };

        // Calculate linear regression slope
        const n = values.length;
        const xSum = (n * (n - 1)) / 2; // Sum of indices 0,1,2...n-1
        const ySum = values.reduce((sum, val) => sum + val, 0);
        const xySum = values.reduce((sum, val, idx) => sum + (val * idx), 0);
        const x2Sum = values.reduce((sum, val, idx) => sum + (idx * idx), 0);

        const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
        
        // Determine trend
        const threshold = inverse ? -1 : 1; // For bundle size, negative slope is good
        
        if (Math.abs(slope) < 0.5) {
            return { trend: 'stable', slope, direction: 'no_change' };
        } else if (slope > threshold) {
            return { 
                trend: inverse ? 'worsening' : 'improving', 
                slope, 
                direction: inverse ? 'increasing' : 'increasing' 
            };
        } else {
            return { 
                trend: inverse ? 'improving' : 'worsening', 
                slope, 
                direction: inverse ? 'decreasing' : 'decreasing' 
            };
        }
    }

    /**
     * Save baseline and history
     */
    saveBaseline(baseline, history, trendAnalysis) {
        // Save main baseline
        const baselinePath = path.join(this.baselineDir, 'metrics.json');
        fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

        // Save history
        const historyPath = path.join(this.baselineDir, 'history.json');
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

        // Save trend analysis
        const trendsPath = path.join(this.baselineDir, 'trends.json');
        fs.writeFileSync(trendsPath, JSON.stringify({
            ...trendAnalysis,
            updated: new Date().toISOString(),
            commit: baseline.commit
        }, null, 2));

        console.log(`✅ Baseline saglabāts: ${baselinePath}`);
        console.log(`📊 Vēsture atjaunota: ${historyPath}`);
        console.log(`📈 Trendu analīze: ${trendsPath}`);
    }

    /**
     * Generate summary report
     */
    generateSummary(baseline, delta, trendAnalysis, isUpdate) {
        const summary = {
            action: isUpdate ? 'updated' : 'created',
            timestamp: new Date().toISOString(),
            commit: baseline.commit,
            branch: baseline.branch,
            metrics: {
                performance: baseline.performance?.performance || null,
                coverage: baseline.coverage?.total || null,
                bundleSize: baseline.bundleSize?.total || null
            },
            delta,
            trends: trendAnalysis,
            metadata: baseline.metadata
        };

        const summaryPath = path.join(this.baselineDir, 'summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        return summary;
    }

    /**
     * Run baseline update
     */
    run() {
        console.log('🎯 Baseline Updater sākas...');
        console.log(`🌿 Branch: ${process.env.GITHUB_REF_NAME || 'unknown'}`);
        console.log(`📋 Event: ${process.env.GITHUB_EVENT_NAME || 'unknown'}`);
        console.log(`🎯 Is Main Branch: ${this.isMainBranch}`);
        console.log(`🔄 Is Merge Event: ${this.isMergeEvent}`);

        try {
            // Check if we should update baseline
            if (!this.isMainBranch) {
                console.log('ℹ️ Not on main branch, skipping baseline update');
                return;
            }

            if (!this.isMergeEvent) {
                console.log('ℹ️ Not a merge event, skipping baseline update');
                return;
            }

            const currentResults = this.loadCurrentResults();
            const existingBaseline = this.loadBaseline();
            
            console.log('📊 Checking metrics acceptability...');
            const acceptability = this.isAcceptableForBaseline(currentResults);
            
            if (!acceptability.acceptable) {
                console.log(`❌ Metrics not acceptable for baseline (${acceptability.score.toFixed(1)}%):`);
                acceptability.issues.forEach(issue => {
                    console.log(`  - ${issue}`);
                });
                
                // Save rejection report
                const rejectionPath = path.join(this.baselineDir, 'rejection.json');
                fs.writeFileSync(rejectionPath, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    commit: currentResults.commit,
                    reason: 'metrics_not_acceptable',
                    score: acceptability.score,
                    issues: acceptability.issues,
                    criteria: acceptability.criteria
                }, null, 2));
                
                console.log('📋 Rejection report saved');
                return;
            }

            console.log(`✅ Metrics acceptable (${acceptability.score.toFixed(1)}%)`);

            // Calculate delta if baseline exists
            const delta = this.calculateDelta(currentResults, existingBaseline);
            
            if (delta) {
                console.log('📊 Baseline comparison:');
                if (delta.performance) {
                    console.log(`  🚀 Performance: ${delta.performance.change > 0 ? '+' : ''}${delta.performance.change.toFixed(1)}%`);
                }
                if (delta.coverage) {
                    console.log(`  🛡️ Coverage: ${delta.coverage.change > 0 ? '+' : ''}${delta.coverage.change.toFixed(1)}%`);
                }
                if (delta.bundleSize) {
                    const sizeChange = delta.bundleSize.change;
                    const sign = sizeChange > 0 ? '+' : '';
                    console.log(`  📦 Bundle Size: ${sign}${this.formatBytes(sizeChange)}`);
                }
            }

            // Create new baseline
            const newBaseline = this.createBaseline(currentResults, delta);
            
            // Update history
            const updatedHistory = this.updateHistory(newBaseline, currentResults);
            
            // Generate trend analysis
            const trendAnalysis = this.generateTrendAnalysis(updatedHistory);
            
            // Save everything
            this.saveBaseline(newBaseline, updatedHistory, trendAnalysis);
            
            // Generate summary
            const summary = this.generateSummary(
                newBaseline, 
                delta, 
                trendAnalysis, 
                !!existingBaseline
            );

            console.log('\n🎉 Baseline atjaunošana pabeigta!');
            console.log(`📈 Action: ${summary.action}`);
            console.log(`📊 Metrics count: ${Object.keys(summary.metrics).filter(k => summary.metrics[k] !== null).length}`);
            console.log(`📋 History entries: ${updatedHistory.length}`);

        } catch (error) {
            console.error('❌ Baseline atjaunošanas kļūda:', error.message);
            process.exit(1);
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        const sign = bytes < 0 ? '-' : '';
        return sign + parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Run if called directly
if (require.main === module) {
    const updater = new BaselineUpdater();
    updater.run();
}

module.exports = BaselineUpdater;