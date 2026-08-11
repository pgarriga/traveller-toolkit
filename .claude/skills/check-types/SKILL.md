---
name: check-types
description: Verify TypeScript types compile without errors and follow project conventions
allowed-tools: Bash, Read, Grep, Glob
---

# Check TypeScript Types

Verify that all TypeScript code compiles correctly and follows project conventions.

## Run Type Check
```bash
npx tsc --noEmit
```

This command MUST complete with no errors.

## Verify No JavaScript Files
```bash
find src -name "*.js" -o -name "*.jsx"
```

This command MUST return no results. All code must be TypeScript.

## Check for `any` Usage
```bash
grep -rn ": any" src --include="*.ts" --include="*.tsx"
```

This should return NO results. Never use `any` type.

## Verify Type Imports
Check that type-only imports use `import type`:
```bash
grep -rn "^import {.*}" src --include="*.ts" --include="*.tsx" | grep -v "import type"
```

Review results - types should use `import type`.

## Check Interface Definitions
Verify all component props have interfaces in `src/types/`:
- `src/types/theme.ts` - Theme types
- `src/types/uwp.ts` - UWP/Planet types
- `src/types/i18n.ts` - Translation types
- `src/types/game-data.ts` - Game data types
- `src/types/components.ts` - Component prop types

## Checklist
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] No `.js` or `.jsx` files in `src/`
- [ ] No `any` types used
- [ ] Type-only imports use `import type`
- [ ] All component props have interface definitions
- [ ] Constants use `as const` for literal types
- [ ] Hooks have typed return interfaces

## Output
Provide a report with:
1. Type check result (pass/fail)
2. Any violations found
3. Specific fixes needed (if any)
