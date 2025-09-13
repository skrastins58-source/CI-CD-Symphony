# 🤖 Copilot Instructions

## 🎯 Goal
Build and maintain a fully automated CI/CD pipeline that includes Lighthouse analysis, coverage tracking, bundle monitoring, Slack notifications, semantic PR checks, and automated releases.

## 🏛️ Architecture Overview
This project uses a standard Node.js setup orchestrated by a GitHub Actions workflow (`.github/workflows/ci-cd-symphony.yml`).

- **Bundling**: `webpack` processes `src/index.js` and outputs the final bundle to `dist/main.js`. The configuration is in `webpack.config.js`.
- **Testing**: `jest` runs tests from `src/**/*.test.js`. It's configured in `jest.config.js` to generate coverage reports in `coverage/`, including the `coverage-summary.json` used by the CI pipeline.
- **Linting**: `eslint` enforces code style. Rules are defined in `.eslintrc.json`.
- **Automation**: `husky` and `lint-staged` are used for pre-commit hooks to automatically lint and fix staged files, ensuring code quality before it reaches the repository.
- **CI/CD**: The entire workflow is defined in `.github/workflows/ci-cd-symphony.yml`. It automates everything from testing to creating releases with `semantic-release`.

## 🧑‍💻 Developer Workflow

### Local Development
1.  **Install Dependencies**: Run `npm install` to set up the project.
2.  **Build**: To create a production bundle, run `npm run build`.
3.  **Test**: Run `npm run test` to execute tests. Use `npm run coverage` to generate a coverage report.
4.  **Lint**: Run `npm run lint` to check for code style issues.

### Committing and Pushing
- **Pre-commit Hook**: When you commit, a pre-commit hook automatically runs `eslint --fix` on staged `.js` files.
- **Semantic Commits**: Commit messages **must** follow the semantic convention (e.g., `feat:`, `fix:`, `chore:`). This is critical for the `semantic-release` process to automatically version and release the software.

### Key Files
- `.github/workflows/ci-cd-symphony.yml`: The main CI/CD pipeline definition.
- `package.json`: Defines scripts, dependencies, and `lint-staged` configuration.
- `jest.config.js`: Jest configuration, including coverage reporters.
- `webpack.config.js`: Webpack configuration for bundling.
- `.eslintrc.json`: ESLint rules for code quality.
