---
name: check-responsive
description: Verify responsive design across all breakpoints and screen sizes
allowed-tools: Read, Grep, Glob
---

# Check Responsive Design

Review the codebase for responsive design issues. Check:

## CSS Breakpoints
1. Read `src/index.css` and identify all `@media` queries
2. Verify breakpoints are consistent (640px for navbar, 480px for mobile)
3. Check that all interactive elements have appropriate sizes for touch (min 44px)

## Component Review
1. Read `src/App.tsx` and check inline styles for:
   - Hardcoded widths that could break on small screens
   - Flex/grid layouts that adapt to screen size
   - Font sizes that scale appropriately
   - Padding/margins that work on mobile

2. Check `src/components/ui/Button.tsx` for touch target sizes

3. Check `src/components/Navbar.tsx` for mobile menu implementation

## Checklist
- [ ] All buttons have `min-height: 44px` for touch targets
- [ ] No horizontal scroll on mobile (max-width: 100%)
- [ ] Text is readable without zooming (min 16px for body, 14px for secondary)
- [ ] Forms stack vertically on mobile
- [ ] Navigation works on both desktop and mobile
- [ ] Images/media scale properly
- [ ] Modal/overlays work on small screens

## Output
Provide a report with:
1. Issues found (if any)
2. Specific line numbers and suggested fixes
3. Confirmation that responsive design is working correctly
