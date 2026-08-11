---
name: sync-version
description: Sync version across all files after running npm version (patch/minor/major)
allowed-tools: Read, Edit, Bash
proactive: true
trigger: after npm version patch/minor/major
---

# Sync Version

Run this skill IMMEDIATELY after incrementing the version with `npm version patch/minor/major`.

## What Gets Updated

| Location | How It Works |
|----------|--------------|
| **Settings (Footer)** | Automatic via Vite `__APP_VERSION__` - reads from package.json at build time |
| **README badges** | Manual update required - this skill handles it |

## Steps

1. **Read current version** from `package.json`

2. **Update README.md badges** - sync the Version badge:
   ```markdown
   [![Version](https://img.shields.io/badge/Version-{VERSION}-blue?style=flat-square)]
   ```

3. **Verify build** works:
   ```bash
   npm run build
   ```

4. **Confirm** version is correctly shown:
   - Check build output has no errors
   - Version in package.json matches README badge

## Example Usage

```
User: npm version patch
User: /sync-version