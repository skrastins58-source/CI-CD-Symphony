#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Updating baseline metrics...');

function updateBaseline() {
  try {
    // Create baselines directory
    const baselinesDir = path.join(__dirname, '../baselines');
    if (!fs.existsSync(baselinesDir)) {
      fs.mkdirSync(baselinesDir, { recursive: true });
    }
    
    // Read current analysis results
    const resultsPath = path.join(__dirname, '../reports/analysis-results.json');
    
    if (!fs.existsSync(resultsPath)) {
      console.log('⚠️ No analysis results found, cannot update baseline');
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Read existing baseline or create new one
    const baselinePath = path.join(baselinesDir, 'metrics-baseline.json');
    let baseline = {};
    
    if (fs.existsSync(baselinePath)) {
      baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    }
    
    // Update baseline with current results
    const newBaseline = {
      ...baseline,
      lastUpdated: new Date().toISOString(),
      bundleSize: {
        current: results.bundleSize?.size || 0,
        trend: calculateTrend(baseline.bundleSize?.current, results.bundleSize?.size),
        history: [...(baseline.bundleSize?.history || []).slice(-9), {
          value: results.bundleSize?.size || 0,
          timestamp: new Date().toISOString()
        }]
      },
      performance: {
        current: results.performance?.scores?.performance || 0,
        trend: calculateTrend(baseline.performance?.current, results.performance?.scores?.performance),
        history: [...(baseline.performance?.history || []).slice(-9), {
          value: results.performance?.scores?.performance || 0,
          timestamp: new Date().toISOString()
        }]
      },
      coverage: {
        current: results.coverage?.total?.lines?.pct || 0,
        trend: calculateTrend(baseline.coverage?.current, results.coverage?.total?.lines?.pct),
        history: [...(baseline.coverage?.history || []).slice(-9), {
          value: results.coverage?.total?.lines?.pct || 0,
          timestamp: new Date().toISOString()
        }]
      }
    };
    
    // Write updated baseline
    fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));
    
    console.log('✅ Baseline updated successfully');
    console.log(`📊 Bundle size trend: ${newBaseline.bundleSize.trend}`);
    console.log(`⚡ Performance trend: ${newBaseline.performance.trend}`);
    console.log(`🧪 Coverage trend: ${newBaseline.coverage.trend}`);
    
    return newBaseline;
  } catch (error) {
    console.error('❌ Baseline update failed:', error.message);
    return null;
  }
}

function calculateTrend(previous, current) {
  if (!previous || !current) return 'stable';
  
  const diff = current - previous;
  const percentChange = Math.abs(diff / previous) * 100;
  
  if (percentChange < 2) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

if (require.main === module) {
  updateBaseline();
}

module.exports = { updateBaseline };