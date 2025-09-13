# Developer Guide

## Release Process

This repository uses [semantic-release](https://semantic-release.gitbook.io/) to automatically handle versioning, changelog generation, and publishing.

### How It Works

1. **Commit Messages**: Use [Conventional Commits](https://conventionalcommits.org/) format for your commit messages:
   - `feat:` for new features (minor version bump)
   - `fix:` for bug fixes (patch version bump) 
   - `BREAKING CHANGE:` in commit body for breaking changes (major version bump)
   - `chore:`, `docs:`, `style:`, `refactor:`, `test:` for other changes (no version bump)

2. **Automatic Release**: When commits are pushed to the `main` branch:
   - The CI/CD pipeline runs analysis and tests
   - If successful, the release job triggers semantic-release
   - semantic-release analyzes commits since last release
   - Determines version bump based on commit types
   - Generates changelog from commit messages
   - Creates a Git tag and GitHub release
   - Publishes to npm (if configured)

### Configuration

The release configuration is defined in `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator", 
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

### Plugins Used

- **@semantic-release/commit-analyzer**: Analyzes commits to determine version bump
- **@semantic-release/release-notes-generator**: Generates release notes from commits
- **@semantic-release/npm**: Publishes package to npm registry (if package.json is configured for publishing)
- **@semantic-release/git**: Commits version changes back to repository

### Environment Variables

The release job requires these environment variables:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions for creating releases
- `NPM_TOKEN`: Required only if publishing to npm registry (configure as repository secret)

### Example Workflow

1. Make changes and commit with conventional format:
   ```bash
   git commit -m "feat: add new dashboard component"
   ```

2. Push to main branch:
   ```bash
   git push origin main
   ```

3. CI/CD pipeline will:
   - Run tests and analysis
   - Automatically create a new release (e.g., v1.1.0)
   - Generate changelog entry
   - Create GitHub release with notes

### Release Types

| Commit Type | Release Type | Version Bump |
|-------------|--------------|--------------|
| `fix:` | Patch | 1.0.0 → 1.0.1 |
| `feat:` | Minor | 1.0.0 → 1.1.0 |
| `BREAKING CHANGE:` | Major | 1.0.0 → 2.0.0 |
| `chore:`, `docs:`, etc. | None | No release |

### Manual Release

If needed, you can trigger a manual release:

```bash
npx semantic-release --dry-run  # Preview what would be released
npx semantic-release            # Perform actual release
```

### Troubleshooting

- **No release created**: Check that commits follow conventional format and include releasable changes
- **Permission errors**: Ensure GITHUB_TOKEN has proper permissions and NPM_TOKEN is valid
- **Version conflicts**: semantic-release handles version management automatically; avoid manual version changes