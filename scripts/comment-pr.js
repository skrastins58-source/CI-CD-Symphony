#!/usr/bin/env node

/**
 * CI/CD Symphony - PR Comment Generator
 * Posts metrics and analysis results as PR comments
 */

const fs = require('fs');
const { Octokit } = require('@octokit/rest');

async function commentOnPR() {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = process.env.PR_NUMBER;
  
  if (!token || !prNumber) {
    console.log('⚠️ Missing GITHUB_TOKEN or PR_NUMBER, skipping PR comment');
    return;
  }

  const octokit = new Octokit({ auth: token });
  
  try {
    // Load analysis results
    let results = {};
    let badges = {};
    
    if (fs.existsSync('reports/analysis-results.json')) {
      results = JSON.parse(fs.readFileSync('reports/analysis-results.json', 'utf8'));
    }
    
    if (fs.existsSync('badges/badges.json')) {
      badges = JSON.parse(fs.readFileSync('badges/badges.json', 'utf8'));
    }

    // Load baseline for comparison
    let baseline = {};
    if (fs.existsSync('metrics/metrics-baseline.json')) {
      baseline = JSON.parse(fs.readFileSync('metrics/metrics-baseline.json', 'utf8'));
    }

    // Generate comparison results
    const comparison = {
      lighthouse: {},
      coverage: {},
      bundleSize: {}
    };

    if (results.lighthouse && baseline.lighthouse) {
      Object.keys(results.lighthouse).forEach(key => {
        if (typeof results.lighthouse[key] === 'number') {
          const diff = results.lighthouse[key] - baseline.lighthouse[key];
          comparison.lighthouse[key] = {
            current: results.lighthouse[key],
            baseline: baseline.lighthouse[key],
            diff: diff,
            trend: diff > 0 ? '📈' : diff < 0 ? '📉' : '➖'
          };
        }
      });
    }

    if (results.coverage && baseline.coverage) {
      Object.keys(results.coverage).forEach(key => {
        if (typeof results.coverage[key] === 'number') {
          const diff = results.coverage[key] - baseline.coverage[key];
          comparison.coverage[key] = {
            current: results.coverage[key].toFixed(1),
            baseline: baseline.coverage[key].toFixed(1),
            diff: diff.toFixed(1),
            trend: diff > 0 ? '📈' : diff < 0 ? '📉' : '➖'
          };
        }
      });
    }

    if (results.bundleSize && baseline.bundleSize) {
      const currentSize = results.bundleSize.totalSize;
      const baselineSize = baseline.bundleSize.totalSize;
      const diff = currentSize - baselineSize;
      const diffPercent = ((diff / baselineSize) * 100).toFixed(1);
      
      comparison.bundleSize = {
        current: Math.round(currentSize / 1024),
        baseline: Math.round(baselineSize / 1024),
        diff: Math.round(diff / 1024),
        diffPercent: diffPercent,
        trend: diff > 0 ? '📈' : diff < 0 ? '📉' : '➖'
      };
    }

    // Create comment content
    const comment = `## 🎼 CI/CD Symphony Analysis Report

### 📊 Performance Metrics

${badges.buildStatus ? `![Build Status](${badges.buildStatus}) ` : ''}${badges.performance ? `![Performance](${badges.performance}) ` : ''}${badges.coverage ? `![Coverage](${badges.coverage}) ` : ''}${badges.bundleSize ? `![Bundle Size](${badges.bundleSize})` : ''}

#### 🚀 Lighthouse Scores
${comparison.lighthouse.performance ? `
| Metric | Current | Baseline | Change |
|--------|---------|----------|--------|
| Performance | ${comparison.lighthouse.performance.current} | ${comparison.lighthouse.performance.baseline} | ${comparison.lighthouse.performance.trend} ${comparison.lighthouse.performance.diff} |
| Accessibility | ${comparison.lighthouse.accessibility.current} | ${comparison.lighthouse.accessibility.baseline} | ${comparison.lighthouse.accessibility.trend} ${comparison.lighthouse.accessibility.diff} |
| Best Practices | ${comparison.lighthouse.bestPractices.current} | ${comparison.lighthouse.bestPractices.baseline} | ${comparison.lighthouse.bestPractices.trend} ${comparison.lighthouse.bestPractices.diff} |
| SEO | ${comparison.lighthouse.seo.current} | ${comparison.lighthouse.seo.baseline} | ${comparison.lighthouse.seo.trend} ${comparison.lighthouse.seo.diff} |
` : 'No lighthouse data available'}

#### 📈 Test Coverage
${comparison.coverage.statements ? `
| Metric | Current | Baseline | Change |
|--------|---------|----------|--------|
| Statements | ${comparison.coverage.statements.current}% | ${comparison.coverage.statements.baseline}% | ${comparison.coverage.statements.trend} ${comparison.coverage.statements.diff}% |
| Branches | ${comparison.coverage.branches.current}% | ${comparison.coverage.branches.baseline}% | ${comparison.coverage.branches.trend} ${comparison.coverage.branches.diff}% |
| Functions | ${comparison.coverage.functions.current}% | ${comparison.coverage.functions.baseline}% | ${comparison.coverage.functions.trend} ${comparison.coverage.functions.diff}% |
| Lines | ${comparison.coverage.lines.current}% | ${comparison.coverage.lines.baseline}% | ${comparison.coverage.lines.trend} ${comparison.coverage.lines.diff}% |
` : 'No coverage data available'}

#### 📦 Bundle Size
${comparison.bundleSize.current ? `
| Metric | Current | Baseline | Change |
|--------|---------|----------|--------|
| Total Size | ${comparison.bundleSize.current}KB | ${comparison.bundleSize.baseline}KB | ${comparison.bundleSize.trend} ${comparison.bundleSize.diff}KB (${comparison.bundleSize.diffPercent}%) |
` : 'No bundle size data available'}

---
*📅 Generated at ${new Date().toISOString()}*
*🤖 Automated by CI/CD Symphony*`;

    // Get repository info from GitHub context
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

    // Find existing comment
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: parseInt(prNumber)
    });

    const existingComment = comments.find(comment => 
      comment.body.includes('🎼 CI/CD Symphony Analysis Report') && 
      comment.user.login === 'github-actions[bot]'
    );

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: comment
      });
      console.log('✅ Updated PR comment');
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: parseInt(prNumber),
        body: comment
      });
      console.log('✅ Created PR comment');
    }

  } catch (error) {
    console.error('❌ Failed to comment on PR:', error.message);
    process.exit(1);
  }
}

commentOnPR().catch(console.error);