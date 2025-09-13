#!/usr/bin/env node

/**
 * CI/CD Symphony - Badge Generator
 * Generates status badges based on analysis results
 */

const fs = require('fs');
const path = require('path');

console.log('🏷️ Generating badges...');

function createBadgeUrl(label, message, color) {
  const encodedLabel = encodeURIComponent(label);
  const encodedMessage = encodeURIComponent(message);
  return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}`;
}

function getColorForScore(score, thresholds = { good: 90, fair: 70 }) {
  if (score >= thresholds.good) return 'brightgreen';
  if (score >= thresholds.fair) return 'yellow';
  return 'red';
}

async function generateBadges() {
  try {
    // Ensure badges directory exists
    if (!fs.existsSync('badges')) {
      fs.mkdirSync('badges', { recursive: true });
    }

    // Load analysis results
    let results = {};
    if (fs.existsSync('reports/analysis-results.json')) {
      results = JSON.parse(fs.readFileSync('reports/analysis-results.json', 'utf8'));
    }

    const badges = {};

    // Lighthouse badges
    if (results.lighthouse) {
      badges.performance = createBadgeUrl(
        'Performance',
        results.lighthouse.performance,
        getColorForScore(results.lighthouse.performance)
      );
      
      badges.accessibility = createBadgeUrl(
        'Accessibility',
        results.lighthouse.accessibility,
        getColorForScore(results.lighthouse.accessibility)
      );
      
      badges.bestPractices = createBadgeUrl(
        'Best Practices',
        results.lighthouse.bestPractices,
        getColorForScore(results.lighthouse.bestPractices)
      );
      
      badges.seo = createBadgeUrl(
        'SEO',
        results.lighthouse.seo,
        getColorForScore(results.lighthouse.seo)
      );
    }

    // Coverage badge
    if (results.coverage) {
      const coverageScore = Math.round(results.coverage.statements);
      badges.coverage = createBadgeUrl(
        'Coverage',
        `${coverageScore}%`,
        getColorForScore(coverageScore, { good: 85, fair: 70 })
      );
    }

    // Bundle size badge
    if (results.bundleSize) {
      const sizeKB = Math.round(results.bundleSize.totalSize / 1024);
      const color = sizeKB < 200 ? 'brightgreen' : sizeKB < 500 ? 'yellow' : 'red';
      badges.bundleSize = createBadgeUrl(
        'Bundle Size',
        `${sizeKB}KB`,
        color
      );
    }

    // Build status badge
    badges.buildStatus = createBadgeUrl(
      'Build',
      results.status === 'success' ? 'passing' : 'failing',
      results.status === 'success' ? 'brightgreen' : 'red'
    );

    // CI/CD status badge
    badges.cicdStatus = createBadgeUrl(
      'CI/CD',
      'active',
      'blue'
    );

    // Save badge URLs
    fs.writeFileSync('badges/badges.json', JSON.stringify(badges, null, 2));

    // Generate badge markdown for README
    const badgeMarkdown = `
## 📊 Project Status

![Build Status](${badges.buildStatus})
![CI/CD Status](${badges.cicdStatus})
${badges.performance ? `![Performance](${badges.performance})` : ''}
${badges.coverage ? `![Coverage](${badges.coverage})` : ''}
${badges.bundleSize ? `![Bundle Size](${badges.bundleSize})` : ''}
${badges.accessibility ? `![Accessibility](${badges.accessibility})` : ''}
${badges.bestPractices ? `![Best Practices](${badges.bestPractices})` : ''}
${badges.seo ? `![SEO](${badges.seo})` : ''}
`;

    fs.writeFileSync('badges/README-badges.md', badgeMarkdown.trim());

    // Output for GitHub Actions
    console.log(`::set-output name=badges::${JSON.stringify(badges)}`);
    
    console.log('✅ Badges generated successfully');
    Object.entries(badges).forEach(([key, url]) => {
      console.log(`🏷️ ${key}: ${url}`);
    });

  } catch (error) {
    console.error('❌ Badge generation failed:', error.message);
    process.exit(1);
  }
}

generateBadges().catch(console.error);