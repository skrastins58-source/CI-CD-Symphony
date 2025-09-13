# 🤖 Copilot Instructions

## 🎯 Goal
Build and maintain a fully automated CI/CD pipeline that includes:

- Lighthouse performance analysis
- Coverage tracking
- Bundle size monitoring
- Slack notifications
- Semantic PR checks
- Baseline metric updates
- GitHub Pages publishing

## 📦 Required Files
- `.github/workflows/ci-cd-symphony.yml`
- `metrics/metrics-baseline.json`
- `coverage/coverage-summary.json`
- `dist/main.js`
- `package.json` and `package-lock.json`

## 🔐 Secrets Needed
- `SLACK_WEBHOOK_URL`
- `SNYK_TOKEN`
- `GITHUB_TOKEN` (default)
- *(Optional)* `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

## 🧪 Testing Instructions
Ensure `npm ci` works locally before pushing.
Use semantic PR titles: `fix:`, `feat:`, `chore:`, etc.

## ✅ Success Criteria
- CI passes without errors
- Status badge is generated
- Slack message is sent
- PR comment includes metrics
- Baseline is updated after merge
