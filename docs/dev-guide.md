# 🎼 CI/CD Symphony Developer Operations Guide

## 📋 Overview

CI/CD Symphony is a comprehensive automated CI/CD pipeline designed for modern development teams. This guide provides detailed operational instructions, troubleshooting steps, and best practices for developers working with this repository.

## 🏗️ Project Structure

```
CI-CD-Symphony/
├── .github/
│   ├── workflows/
│   │   └── ci-cd-symphony.yml        # Main CI/CD pipeline configuration
│   └── copilot-instructions.md       # GitHub Copilot configuration
├── docs/
│   └── dev-guide.md                  # This developer guide
├── scripts/                          # CI/CD automation scripts (expected)
│   ├── run-analysis.js
│   ├── generate-badges.js
│   ├── comment-pr.js
│   ├── slack-notify.js
│   └── update-baseline.js
├── metrics/                          # Performance metrics (expected)
│   └── metrics-baseline.json
├── coverage/                         # Test coverage data (expected)
│   └── coverage-summary.json
├── baselines/                        # Performance baselines (expected)
├── reports/                          # Generated reports (CI-generated)
├── badges/                           # Status badges (CI-generated)
├── dist/                             # Built artifacts (expected)
│   └── main.js
├── package.json                      # Node.js project configuration (expected)
├── package-lock.json                 # Dependency lock file (expected)
├── .gitignore                        # Git ignore patterns
├── LICENSE                           # MIT License
└── README.md                         # Project documentation
```

### Core Components

1. **CI/CD Pipeline**: Automated workflow with 5 jobs (analysis, notify, baseline, security, preview)
2. **Metrics Analysis**: Performance monitoring and delta analysis
3. **Security Scanning**: npm audit and CodeQL analysis
4. **Slack Integration**: Automated notifications for team communication
5. **GitHub Pages**: Preview deployments and documentation hosting

## ⚡ Command Sequences & Expected Durations

### Prerequisites Setup
```bash
# Install Node.js 18+ (if not already installed)
node --version  # Should return v18+
npm --version   # Should return 8+

# Clone repository (first time only)
git clone https://github.com/skrastins58-source/CI-CD-Symphony.git
cd CI-CD-Symphony
```

### Standard Development Workflow

#### 1. Initial Setup (5-10 minutes)
```bash
# Install dependencies - Duration: 2-5 minutes
npm ci

# Verify installation
npm list --depth=0
```

#### 2. Development Commands

```bash
# Run tests - Duration: 30 seconds - 2 minutes
npm test

# Run test coverage - Duration: 1-3 minutes  
npm run coverage

# Lint code - Duration: 10-30 seconds
npm run lint

# Fix linting issues - Duration: 10-30 seconds
npm run lint:fix

# Build project - Duration: 30 seconds - 2 minutes
npm run build

# Run full analysis (performance + coverage + bundle) - Duration: 2-5 minutes
npm run analysis
```

#### 3. Pre-commit Validation (2-6 minutes total)
```bash
# Complete pre-commit sequence
npm ci && npm run lint && npm test && npm run build
```

### CI/CD Job Durations

| Job | Expected Duration | Max Timeout | Can Cancel |
|-----|------------------|-------------|------------|
| Analysis | 3-8 minutes | 15 minutes | ❌ No |
| Security | 5-10 minutes | 20 minutes | ❌ No |
| Notify | 30 seconds - 2 minutes | 5 minutes | ✅ Yes |
| Preview | 2-5 minutes | 10 minutes | ✅ Yes |
| Baseline | 1-3 minutes | 10 minutes | ❌ No |

## ⏱️ Timeout & Cancellation Rules

### Jobs That Must NEVER Be Canceled

1. **Analysis Job** (`analysis`)
   - **Why**: Generates critical metrics and reports needed by other jobs
   - **Timeout**: 15 minutes
   - **Dependencies**: All other jobs depend on this

2. **Security Job** (`security`)
   - **Why**: Security scanning is essential for compliance
   - **Timeout**: 20 minutes
   - **Critical for**: CodeQL analysis and vulnerability detection

3. **Baseline Job** (`baseline`)
   - **Why**: Updates performance baselines on main branch
   - **Timeout**: 10 minutes
   - **When**: Only runs on main branch after successful merge

### Recommended Timeout Settings

```yaml
# Recommended timeout-minutes for different job types
timeout-minutes:
  analysis: 15        # Critical job, needs time for complete analysis
  security: 20        # Security scans can take longer
  baseline: 10        # Baseline updates are typically fast
  notify: 5          # Slack notifications should be quick
  preview: 10        # Build and deploy should be reasonable
```

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Safe for most jobs except critical ones
```

**Note**: The `cancel-in-progress: true` setting at workflow level is overridden by job-specific logic that protects critical jobs.

## ✅ Pre-commit Validation Checklist

Before creating a pull request, ensure you've completed:

### Code Quality
- [ ] **Linting**: `npm run lint` passes without errors
- [ ] **Formatting**: Code follows project style guidelines
- [ ] **Tests**: `npm test` passes with >80% coverage
- [ ] **Build**: `npm run build` completes successfully

### Dependencies & Security
- [ ] **Dependencies**: `npm ci` installs without vulnerabilities
- [ ] **Audit**: `npm audit --audit-level moderate` passes
- [ ] **Lock file**: `package-lock.json` is updated if dependencies changed

### Git & Documentation
- [ ] **Commit messages**: Follow semantic commit format (`feat:`, `fix:`, `docs:`, etc.)
- [ ] **Branch naming**: Descriptive branch names (`feature/`, `fix/`, `docs/`)
- [ ] **Documentation**: Update relevant docs if functionality changed

### Performance & Metrics
- [ ] **Bundle size**: No significant increase without justification
- [ ] **Performance**: No regression in critical paths
- [ ] **Memory usage**: No memory leaks in long-running operations

### Integration Tests
- [ ] **Local CI simulation**: Run `npm run ci:local` if available
- [ ] **Edge cases**: Test boundary conditions and error scenarios
- [ ] **Cross-browser**: Verify compatibility if UI changes made

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Dependency Installation Failures

**Issue**: `npm ci` fails with dependency conflicts
```
npm ERR! peer dep missing: @types/node@^18.0.0
```

**Causes**:
- Node.js version mismatch
- Corrupted package-lock.json
- Network connectivity issues

**Solutions**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For persistent issues, use exact versions
npm ci --no-optional
```

#### 2. Test Failures

**Issue**: Tests fail locally but pass in CI
```
FAIL src/test.js
Expected: 42, Received: undefined
```

**Causes**:
- Environment variable differences
- Timezone/locale differences
- Missing test setup

**Solutions**:
```bash
# Run tests with CI environment
NODE_ENV=test npm test

# Clear Jest cache
npm test -- --clearCache

# Run specific test file
npm test -- src/test.js --verbose

# Debug test with Node inspect
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### 3. Build/Bundle Issues

**Issue**: Build fails or bundle size exceeds limits
```
ERROR: Bundle size limit exceeded: 2.5MB > 2MB
```

**Causes**:
- Unused dependencies included
- Large assets not optimized
- Missing tree-shaking configuration

**Solutions**:
```bash
# Analyze bundle composition
npm run build:analyze

# Check for unused dependencies
npm run deps:check

# Optimize images and assets
npm run assets:optimize

# Review webpack bundle analyzer
npm run bundle:analyze
```

#### 4. Performance Regression

**Issue**: Lighthouse scores drop below baseline
```
Performance: 65 (baseline: 85)
```

**Causes**:
- Increased JavaScript bundle size
- Blocking render operations
- Inefficient API calls

**Solutions**:
```bash
# Run local performance audit
npm run perf:audit

# Profile JavaScript execution
npm run perf:profile

# Check for render-blocking resources
npm run perf:render-blocking

# Validate API response times
npm run perf:api-check
```

#### 5. Security Vulnerabilities

**Issue**: npm audit reports vulnerabilities
```
found 3 vulnerabilities (1 moderate, 2 high)
```

**Causes**:
- Outdated dependencies
- Known security issues in packages
- Development dependencies with vulnerabilities

**Solutions**:
```bash
# Fix automatically fixable vulnerabilities
npm audit fix

# Review specific vulnerabilities
npm audit --json | jq '.vulnerabilities'

# Update specific packages
npm update package-name

# For persistent issues, check for alternatives
npm ls package-name  # Find dependents
```

#### 6. CI/CD Pipeline Failures

**Issue**: GitHub Actions workflow fails

**Common Job Failures**:

| Job | Error Pattern | Solution |
|-----|---------------|----------|
| Analysis | `scripts/run-analysis.js not found` | Ensure script exists and is executable |
| Security | `CodeQL init failed` | Check language configuration |
| Notify | `Slack webhook failed` | Verify SLACK_WEBHOOK_URL secret |
| Preview | `GitHub Pages deploy failed` | Check repository settings |
| Baseline | `Permission denied` | Verify GITHUB_TOKEN permissions |

**General CI Debugging**:
```bash
# Check workflow syntax
yamllint .github/workflows/ci-cd-symphony.yml

# Validate workflow locally (if act is installed)
act pull_request

# Review logs for specific job
# Use GitHub CLI: gh run view <run-id> --log
```

### Performance Optimization Tips

1. **Bundle Size Management**:
   - Use dynamic imports for large dependencies
   - Implement proper tree-shaking
   - Compress and optimize assets

2. **Test Performance**:
   - Run tests in parallel when possible
   - Use test.only for debugging specific tests
   - Mock heavy dependencies in unit tests

3. **Build Optimization**:
   - Enable caching for CI builds
   - Use incremental builds when available
   - Optimize Docker layer caching

## 🧪 Manual Testing Scenarios

### 1. Metrics Validation Testing

#### Scenario: Verify Performance Metrics Collection
```bash
# Setup
npm ci
npm run build

# Execute
npm run analysis

# Validate
ls -la reports/lighthouse/
cat reports/lighthouse/lighthouse-report.json | jq '.categories.performance.score'

# Expected Results
# - Performance score: 0.8+ (80+)
# - Files generated in reports/ directory
# - metrics-baseline.json updated
```

#### Scenario: Coverage Threshold Validation
```bash
# Execute
npm test -- --coverage

# Validate
cat coverage/coverage-summary.json | jq '.total.lines.pct'

# Expected Results
# - Line coverage: >80%
# - Branch coverage: >75%
# - Function coverage: >90%
```

### 2. Regression Simulation Testing

#### Scenario: Intentional Performance Regression
```bash
# Create temporary performance-heavy code
echo 'const heavyTask = () => { for(let i = 0; i < 1000000; i++) Math.random(); }; heavyTask();' >> src/test-heavy.js

# Run analysis
npm run analysis

# Validate detection
grep -i "regression" reports/analysis-summary.json

# Cleanup
rm src/test-heavy.js
```

#### Scenario: Bundle Size Regression
```bash
# Add large dependency temporarily
npm install --save-dev lodash

# Run build and analysis
npm run build && npm run analysis

# Check bundle size warnings
cat reports/bundle-analysis.json | jq '.size'

# Cleanup
npm uninstall lodash
git checkout package*.json
```

### 3. Baseline Update Testing

#### Scenario: Manual Baseline Update Simulation
```bash
# Backup current baseline
cp metrics/metrics-baseline.json metrics/metrics-baseline.json.backup

# Generate new metrics
npm run analysis

# Simulate baseline update
node scripts/update-baseline.js

# Validate changes
diff metrics/metrics-baseline.json.backup metrics/metrics-baseline.json

# Restore if needed
mv metrics/metrics-baseline.json.backup metrics/metrics-baseline.json
```

### 4. Integration Testing Scenarios

#### Scenario: Full CI/CD Pipeline Simulation
```bash
# Simulate PR workflow
git checkout -b test/manual-validation
echo "# Test change" >> README.md
git add . && git commit -m "test: manual validation"

# Push to trigger CI (if configured)
git push origin test/manual-validation

# Monitor workflow progress
# Check: GitHub Actions tab for workflow execution
# Validate: All jobs complete successfully
# Verify: PR comment with metrics appears
# Confirm: Slack notification sent (if configured)

# Cleanup
git checkout main
git branch -D test/manual-validation
```

#### Scenario: Security Scan Validation
```bash
# Add intentional vulnerability for testing
echo '{"dependencies": {"lodash": "4.17.0"}}' > package-vulnerable.json

# Run security scan
npm audit --audit-level moderate

# Expected: Vulnerabilities detected and reported
# Cleanup
rm package-vulnerable.json
```

### 5. Error Recovery Testing

#### Scenario: Failed Job Recovery
```bash
# Simulate analysis failure
mv scripts/run-analysis.js scripts/run-analysis.js.backup
echo 'throw new Error("Simulated failure");' > scripts/run-analysis.js

# Run locally to test error handling
npm run analysis

# Expected: Graceful error handling, proper exit codes
# Restore
mv scripts/run-analysis.js.backup scripts/run-analysis.js
```

## 📞 Support & Additional Resources

### Quick Reference Commands
```bash
# Health check
npm run health:check

# Full pipeline simulation
npm run ci:simulate

# Reset to clean state
npm run reset:clean

# Emergency pipeline stop
# Cancel via GitHub Actions UI or:
gh run cancel <run-id>
```

### Environment Variables for Testing
```bash
# For local development
export NODE_ENV=development
export CI=false
export GITHUB_ACTIONS=false

# For CI simulation
export NODE_ENV=test
export CI=true
export GITHUB_ACTIONS=true
```

### Key Documentation Links
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated**: September 13, 2024  
**Version**: 1.0.0  
**Maintainer**: CI/CD Symphony Team

> 💡 **Tip**: Keep this guide updated as the project evolves. When adding new scripts or changing timeouts, update the corresponding sections here.