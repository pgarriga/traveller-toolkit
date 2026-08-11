---
name: update-badges
description: Update README.md badges when library versions or project version changes in package.json
allowed-tools: Read, Edit
proactive: true
trigger: after npm version, after dependency updates
---

# Update README Badges

Sync README.md badges with current versions from package.json.

**IMPORTANT**: Run this skill whenever:
- Updating dependencies (npm update, npm install)
- Bumping project version in package.json
- After any version change

## Steps

1. Read `package.json` and extract versions:
   - `version` field → **Version badge** (project version)
   - `dependencies.react` → React badge
   - `devDependencies.vite` → Vite badge
   - `dependencies.tesseract.js` → Tesseract.js badge

2. Read `README.md` and update ALL badges to match:

### Badge Format

```markdown
[![Version](https://img.shields.io/badge/Version-{PROJECT_VERSION}-blue?style=flat-square)]
[![React](https://img.shields.io/badge/React-{VERSION}-61DAFB?style=flat-square&logo=react&logoColor=white)]
[![Vite](https://img.shields.io/badge/Vite-{VERSION}-646CFF?style=flat-square&logo=vite&logoColor=white)]
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-{VERSION}-4285F4?style=flat-square&logo=google&logoColor=white)]
```

### Version Extraction Rules

| Source | Rule | Example |
|--------|------|---------|
| Project version | Keep as-is | `1.0.0` → `1.0.0` |
| Dependencies | Remove `^`/`~`, use major.minor | `^19.2.4` → `19.2` |

## Output

1. List current versions from package.json (including project version)
2. List current badge versions from README.md
3. Update any badges that are out of sync
4. Confirm changes made (or "All badges up to date")

## When to Bump Project Version

Bump `version` in package.json following semver:
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes
