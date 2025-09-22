# 🤖 CI/CD Symphony Developer Instructions

**ALWAYS reference these instructions first and follow them exactly. Only fallback to search or additional context gathering if the information here is incomplete or found to be in error.**

## 🎯 Project Overview
CI/CD Symphony is a comprehensive automated CI/CD pipeline template with metrics analysis, badge generation, Slack notifications, security scanning, and baseline management. It includes both a Node.js server application and a webpack-bundled frontend.

## 🚀 Quick Start (Required Steps)

### Essential Commands - Run These In Order
1. **Install dependencies**: `npm install` 
   - **Time**: ~60 seconds for fresh install
   - **NEVER CANCEL**: Always wait for completion, even if it seems slow

2. **Build the application**: `npm run build`
   - **Time**: ~1-2 seconds (very fast)
   - Builds the frontend webpack bundle to `dist/`

3. **Run tests**: `npm test`
   - **Time**: ~1-2 seconds
   - Runs Jest tests with coverage reporting
   - **Required**: Tests must pass before making any changes

4. **Lint code**: `npm run lint`
   - **Time**: ~1 second
   - **Always run this before committing** - CI will fail without clean linting

## 🧪 Testing and Validation

### Test Commands (All Required Before Changes)
- `npm test` - Run full test suite with coverage (1-2 seconds)
- `npm run lint` - ESLint validation (1 second) 
- `npm run build` - Webpack build (1-2 seconds)

### Manual Validation Scenarios
**ALWAYS test these scenarios after making changes:**

1. **Server Functionality Test**:
   ```bash
   npm run server
   # In another terminal:
   curl http://localhost:3000/health
   curl http://localhost:3000/
   # Stop with Ctrl+C
   ```

2. **CI/CD Scripts Test** (Test all of these):
   ```bash
   node scripts/run-analysis.js     # ~3-5 seconds
   node scripts/generate-badges.js  # ~1 second  
   PR_NUMBER=123 node scripts/comment-pr.js  # ~1 second
   SLACK_WEBHOOK_URL=test node scripts/slack-notify.js  # ~1 second
   node scripts/update-baseline.js  # ~1 second
   ```

## 📁 Key Project Structure

### Critical Files (Required by CI/CD workflow)
- `.github/workflows/ci-cd-symphony.yml` - Main CI/CD pipeline
- `package.json` - Dependencies and scripts
- `scripts/` - CI/CD automation scripts
  - `run-analysis.js` - Metrics analysis (bundle size, performance, coverage)
  - `generate-badges.js` - SVG badge generation
  - `comment-pr.js` - PR comment generation
  - `slack-notify.js` - Slack notifications
  - `update-baseline.js` - Baseline metric updates

### Source Code
- `src/main.js` - Express.js server application
- `src/client.js` - Frontend JavaScript (webpack entry)
- `src/index.html` - Frontend HTML template
- `src/main.test.js` - Server tests
- `src/client.test.js` - Frontend tests

### Generated Directories (Created by scripts)
- `dist/` - Webpack build output (ignored)
- `reports/` - Analysis results JSON files (ignored - generated in CI)
- `badges/` - Generated SVG badges (ignored - generated in CI)  
- `baselines/` - Metric baseline tracking (tracked in git)
- `coverage/` - Jest coverage reports (ignored)

## ⚡ Build and Development

### Development Server
```bash
npm run dev          # Webpack dev server on port 3000
npm run server       # Express server on port 3000
```

### Production Build
```bash
npm run build        # Webpack production build (~1-2 seconds)
npm start           # Start Express server
```

## 🔧 Configuration Files
- `webpack.config.js` - Frontend build configuration
- `jest.config.js` - Test configuration with coverage thresholds
- `.eslintrc.js` - Linting rules (browser + node + jest environments)

## 🎼 CI/CD Workflow Understanding

### Workflow Jobs (from `.github/workflows/ci-cd-symphony.yml`)
1. **analysis** - Runs `npm ci`, `npm test`, analysis scripts
2. **notify** - Sends Slack notifications  
3. **baseline** - Updates metrics baseline (main branch only)
4. **security** - CodeQL security scanning
5. **preview** - GitHub Pages preview deployment (PRs only)

### Required Secrets/Variables
- `SLACK_WEBHOOK_URL` (optional) - For Slack notifications
- `SNYK_TOKEN` (optional) - For security scanning
- `GITHUB_TOKEN` (provided automatically)

## ✅ Pre-Commit Checklist
**ALWAYS run these before pushing changes:**

1. `npm run lint` - Must pass cleanly
2. `npm test` - All tests must pass
3. `npm run build` - Must build successfully
4. Test server manually: `npm run server` then `curl http://localhost:3000/health`
5. Test analysis scripts: `node scripts/run-analysis.js`

## 🚨 Critical Timing Information

### Command Timeouts (NEVER CANCEL these operations)
- `npm install`: 60-90 seconds (normal for fresh install)
- `npm test`: 1-2 seconds (very fast)
- `npm run build`: 1-2 seconds (very fast)
- `npm run lint`: ~1 second (very fast)
- Analysis scripts: 1-5 seconds each

### CI/CD Workflow Timing
- Total workflow time: ~3-5 minutes
- Analysis job: ~2 minutes
- Security scanning: ~2-3 minutes
- **NEVER CANCEL**: CI jobs can take 5-10 minutes total

## 🔍 Troubleshooting

### Common Issues
1. **Build failures**: Check webpack.config.js syntax
2. **Test failures**: Run `npm test -- --verbose` for details
3. **Lint errors**: Run `npm run lint -- --fix` to auto-fix
4. **Coverage too low**: Adjust thresholds in `jest.config.js`

### Working with Analysis Scripts
- All scripts output JSON to `reports/` directory
- Scripts generate GitHub Actions outputs with `::set-output`
- Badge generation creates SVG files in `badges/`
- Baseline updates track metric trends over time

## 📊 Metrics and Monitoring

### Tracked Metrics
- **Bundle Size**: Webpack output size (currently ~3.27 KB)
- **Test Coverage**: Lines/statements/functions/branches
- **Performance**: Simulated Lighthouse scores
- **Build Status**: Pass/fail status

### Baseline Management
- Baselines auto-update on main branch merges
- Trend detection: up/down/stable
- History tracking (last 10 data points)

## 🎯 Development Workflow

### Making Changes
1. **Start**: Always run quick validation (`npm test && npm run lint && npm run build`)
2. **Develop**: Make minimal changes
3. **Test**: Re-run validation commands
4. **Manual Test**: Test server and scripts
5. **Commit**: Ensure all validations pass

### Working with CI/CD Scripts
- Scripts are standalone Node.js files in `scripts/`
- Each script has specific environment variable inputs
- All scripts generate JSON reports for workflow consumption
- Test scripts individually before relying on CI workflow

This project is designed for maximum automation and minimal manual intervention. Always validate changes thoroughly before committing as the CI pipeline expects all components to work together seamlessly.
