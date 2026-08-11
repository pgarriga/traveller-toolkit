---
name: check-a11y
description: Verify accessibility (a11y) compliance for screen readers and keyboard navigation
allowed-tools: Read, Grep, Glob
---

# Check Accessibility (a11y)

Review the codebase for accessibility issues following WCAG 2.1 guidelines.

## Semantic HTML
1. Check that headings follow proper hierarchy (h1 > h2 > h3)
2. Verify buttons are `<button>` not `<div onClick>`
3. Ensure links are `<a>` with proper href
4. Check forms have associated `<label>` elements

## ARIA Attributes
1. Decorative icons must have `aria-hidden="true"`
2. Interactive elements need accessible names
3. Dynamic content should use `aria-live` regions
4. Modal/dialogs need proper `role` and focus management

## Keyboard Navigation
1. All interactive elements must be focusable
2. Tab order should be logical
3. Focus states must be visible
4. Escape key should close modals/menus

## Color & Contrast
1. Text contrast ratio minimum 4.5:1 (normal text) or 3:1 (large text)
2. Information not conveyed by color alone
3. Focus indicators clearly visible

## Form Accessibility
1. All inputs have labels (visible or `aria-label`)
2. Error messages are announced
3. Required fields are indicated
4. Form validation is accessible

## Review Files
- `src/App.tsx` - Main application component
- `src/components/Navbar.tsx` - Navigation accessibility
- `src/components/icons/index.tsx` - Icon aria-hidden
- `src/views/*.tsx` - All view components
- `src/index.css` - Check focus styles exist

## Checklist
- [ ] All images/icons have alt text or aria-hidden
- [ ] Form inputs have associated labels
- [ ] Buttons have accessible names
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] No auto-playing media
- [ ] Language is set on html element

## Output
Provide a report with:
1. Critical issues (must fix)
2. Warnings (should fix)
3. Passed checks
4. Specific line numbers and code fixes for each issue
