#!/usr/bin/env node

/**
 * CI/CD Symphony - Baseline Updater
 * Updates baseline metrics after successful merges to main branch
 */

const fs = require('fs');
const path = require('path');

async function updateBaseline() {
  console.log('🎯 Updating baseline metrics...');

  try {
    // Ensure baselines directory exists
    if (!fs.existsSync('baselines')) {
      fs.mkdirSync('baselines', { recursive: true });
    }

    // Load current analysis results
    let results = {};
    if (fs.existsSync('reports/analysis-results.json')) {
      results = JSON.parse(fs.readFileSync('reports/analysis-results.json', 'utf8'));
    } else {
      console.log('⚠️ No analysis results found, skipping baseline update');
      return;
    }

    // Load existing baseline
    let baseline = {};
    if (fs.existsSync('metrics/metrics-baseline.json')) {
      baseline = JSON.parse(fs.readFileSync('metrics/metrics-baseline.json', 'utf8'));
    }

    // Create updated baseline
    const updatedBaseline = {
      ...baseline,
      lighthouse: results.lighthouse || baseline.lighthouse,
      coverage: results.coverage || baseline.coverage,
      bundleSize: results.bundleSize || baseline.bundleSize,
      meta: {
        version: process.env.npm_package_version || baseline.meta?.version || '1.0.0',
        branch: process.env.GITHUB_REF_NAME || 'main',
        commit: process.env.GITHUB_SHA || 'unknown',
        buildNumber: parseInt(process.env.GITHUB_RUN_NUMBER) || 1,
        environment: 'production',
        lastUpdated: new Date().toISOString(),
        actor: process.env.GITHUB_ACTOR || 'unknown'
      }
    };

    // Save updated baseline
    fs.writeFileSync(
      'metrics/metrics-baseline.json',
      JSON.stringify(updatedBaseline, null, 2)
    );

    // Create backup in baselines directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `baseline-${timestamp}.json`;
    fs.writeFileSync(
      path.join('baselines', backupFilename),
      JSON.stringify(updatedBaseline, null, 2)
    );

    // Keep only last 10 baseline backups
    const baselineFiles = fs.readdirSync('baselines')
      .filter(file => file.startsWith('baseline-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (baselineFiles.length > 10) {
      const filesToDelete = baselineFiles.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join('baselines', file));
        console.log(`🗑️ Deleted old baseline: ${file}`);
      });
    }

    // Generate comparison report
    const comparison = {
      updated: new Date().toISOString(),
      changes: {}
    };

    if (baseline.lighthouse && results.lighthouse) {
      comparison.changes.lighthouse = {};
      Object.keys(results.lighthouse).forEach(key => {
        if (typeof results.lighthouse[key] === 'number') {
          const oldValue = baseline.lighthouse[key];
          const newValue = results.lighthouse[key];
          const diff = newValue - oldValue;
          if (Math.abs(diff) > 0.1) {
            comparison.changes.lighthouse[key] = {
              old: oldValue,
              new: newValue,
              diff: diff
            };
          }
        }
      });
    }

    if (baseline.coverage && results.coverage) {
      comparison.changes.coverage = {};
      Object.keys(results.coverage).forEach(key => {
        if (typeof results.coverage[key] === 'number') {
          const oldValue = baseline.coverage[key];
          const newValue = results.coverage[key];
          const diff = newValue - oldValue;
          if (Math.abs(diff) > 0.1) {
            comparison.changes.coverage[key] = {
              old: oldValue,
              new: newValue,
              diff: diff
            };
          }
        }
      });
    }

    if (baseline.bundleSize && results.bundleSize) {
      const oldSize = baseline.bundleSize.totalSize;
      const newSize = results.bundleSize.totalSize;
      const diff = newSize - oldSize;
      const diffPercent = ((diff / oldSize) * 100);
      
      if (Math.abs(diffPercent) > 1) {
        comparison.changes.bundleSize = {
          old: oldSize,
          new: newSize,
          diff: diff,
          diffPercent: diffPercent
        };
      }
    }

    fs.writeFileSync(
      'baselines/comparison-report.json',
      JSON.stringify(comparison, null, 2)
    );

    console.log('✅ Baseline updated successfully');
    console.log(`📊 Backup saved as: ${backupFilename}`);
    
    // Log significant changes
    if (Object.keys(comparison.changes).length > 0) {
      console.log('📈 Significant changes detected:');
      Object.entries(comparison.changes).forEach(([category, changes]) => {
        console.log(`  ${category}:`);
        Object.entries(changes).forEach(([metric, change]) => {
          if (typeof change.diff === 'number') {
            const trend = change.diff > 0 ? '📈' : '📉';
            console.log(`    ${metric}: ${change.old} → ${change.new} (${trend} ${change.diff.toFixed(2)})`);
          }
        });
      });
    } else {
      console.log('➖ No significant changes from baseline');
    }

  } catch (error) {
    console.error('❌ Failed to update baseline:', error.message);
    process.exit(1);
  }
}

updateBaseline().catch(console.error);