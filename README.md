# CI-CD-Symphony

## 📊 Project Status

![Build Status](https://img.shields.io/badge/Build-passing-brightgreen)
![CI/CD Status](https://img.shields.io/badge/CI%2FCD-active-blue)
![Performance](https://img.shields.io/badge/Performance-97-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-88%25-brightgreen)
![Bundle Size](https://img.shields.io/badge/Bundle%20Size-242KB-yellow)
![Accessibility](https://img.shields.io/badge/Accessibility-98-brightgreen)
![Best Practices](https://img.shields.io/badge/Best%20Practices-97-brightgreen)
![SEO](https://img.shields.io/badge/SEO-99-brightgreen)

Pilnībā automatizēta CI/CD plūsma ar delta analīzi, statusa badge, dokumentācijas ģenerēšanu, Slack notifikācijām, drošības skenēšanu un baseline atjaunošanu. Ideāli piemērots modernām komandām, kas vēlas redzamu, uzturamu un iedvesmojošu DevOps kultūru.

## 🎼 CI/CD Symphony Features

### 🚀 Performance Monitoring
- **Lighthouse Analysis**: Automated performance, accessibility, SEO, and PWA scoring
- **Real-time Metrics**: Continuous monitoring with baseline comparisons
- **Performance Budgets**: Configurable thresholds and alerts

### 📊 Test Coverage Tracking
- **Comprehensive Coverage**: Statement, branch, function, and line coverage
- **Coverage Thresholds**: Automated pass/fail based on coverage targets
- **Historical Tracking**: Coverage trends and baseline updates

### 📦 Bundle Size Analysis
- **Bundle Monitoring**: Track total and gzipped bundle sizes
- **Asset Analysis**: Individual asset size tracking
- **Size Budgets**: Configurable size limits and warnings

### 🔔 Smart Notifications
- **Slack Integration**: Real-time build status and metrics notifications
- **Selective Alerts**: Configurable notification triggers
- **Rich Messaging**: Detailed metrics and comparison data

### 🔒 Security Scanning
- **Automated Audits**: npm audit and dependency vulnerability checks
- **CodeQL Analysis**: Static code analysis for security issues
- **Continuous Monitoring**: Regular security assessments

### 🎯 Baseline Management
- **Automatic Updates**: Baseline metrics updated on successful merges
- **Historical Data**: Comprehensive baseline history and backup
- **Delta Analysis**: Smart comparison with previous baselines

## 🚀 Quick Start

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build application
npm run build

# Start development server
npm run dev

# Run full CI pipeline locally
npm run ci
```

## 📋 Required Setup

### Environment Variables
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `SNYK_TOKEN`: Snyk API token for security scanning
- `GITHUB_TOKEN`: GitHub token (automatically provided in Actions)

### Workflow Integration
The CI/CD pipeline automatically runs on:
- **Pull Requests**: Analysis, testing, and preview deployments
- **Main Branch**: Full pipeline with baseline updates and production deployment

## 🎯 Success Criteria
- ✅ CI passes without errors
- ✅ Status badges are generated and updated
- ✅ Slack notifications are sent for build status
- ✅ PR comments include detailed metrics comparison
- ✅ Baseline metrics are updated after successful merges
- ✅ GitHub Pages deployment is successful
