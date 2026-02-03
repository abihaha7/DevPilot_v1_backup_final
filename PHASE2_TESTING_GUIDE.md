# Phase 2 Testing Guide

## Quick Start

### Manual Testing Checklist

#### 1. ChatFeature Component
**Path**: Open feature "Code Chat"

**Tests**:
- [ ] Component loads without errors
- [ ] Input field accepts text
- [ ] "Send" button is clickable
- [ ] Message appears in chat when sent
- [ ] Messages have correct role (user/assistant)
- [ ] Auto-scroll to latest message works
- [ ] Close button hides the feature

**Expected Behavior**:
- User types a message → hits send
- Message appears with user role (right-aligned)
- Assistant responds with mock message
- Response shows "AI explanation not available in webview" text
- Chat history maintains order

---

#### 2. TestFeature Component
**Path**: Open feature "Test Runner"

**Tests**:
- [ ] Component loads without errors
- [ ] "Run Tests" button is visible
- [ ] Clicking "Run Tests" shows loading spinner
- [ ] Test results display after 2 seconds
- [ ] Statistics calculate correctly:
  - Passed: Should show count
  - Failed: Should show count
  - Skipped: Should show count
  - Pass Rate: Should show percentage
- [ ] Progress bar fills based on pass rate
- [ ] Color coding is correct (green for passed, red for failed)

**Expected Behavior**:
- Mock tests: 15 passed, 3 failed, 2 skipped
- Pass rate: 78% (15/(15+3))
- Progress bar filled to ~78%
- Statistics displayed prominently

---

#### 3. SnippetsFeature Component
**Path**: Open feature "Snippets"

**Tests**:
- [ ] Component loads without errors
- [ ] 3 sample snippets display in list
- [ ] Search box filters by title
- [ ] Search filters by tags
- [ ] Code preview shows correctly
- [ ] "Insert Snippet" button is clickable
- [ ] Clicking insert shows success message
- [ ] Success message disappears after 2 seconds

**Expected Behavior**:
- Sample snippets:
  1. Try-Catch Block (tags: error, handling)
  2. Async Function (tags: async, promise)
  3. Array Operations (tags: array, utility)
- Search "try" → filters to Try-Catch Block
- Search "async" → filters to Async Function
- Preview shows code with formatting

---

#### 4. QuickFixFeature Component
**Path**: Open feature "Quick Fixes"

**Tests**:
- [ ] Component loads without errors
- [ ] 4 quick fix categories display
- [ ] Filter buttons work for each category
- [ ] Before/after code shows in color diff
- [ ] "Apply Fix" button is clickable
- [ ] Clicking apply shows "✓ Fix applied" feedback
- [ ] Feedback message disappears after 2 seconds
- [ ] Category filtering works correctly

**Expected Behavior**:
- 4 categories: Performance, Style, Security, Best-Practice
- Each has color-coded button
- Clicking category filters to that type
- Before code in red, after in green
- Applied state shows success checkmark

---

#### 5. AchievementsView Component
**Path**: Open feature "Achievements"

**Tests**:
- [ ] Component loads without errors
- [ ] All 9 achievements display
- [ ] Filter tabs visible (All, Unlocked, Locked)
- [ ] Statistics show correct counts
- [ ] "All" tab shows 9 achievements
- [ ] "Unlocked" tab shows 2 achievements
- [ ] "Locked" tab shows 7 achievements
- [ ] Each achievement badge displays:
  - Title
  - Progress percentage (where applicable)
  - Lock indicator (for locked)
  - Unlock checkmark (for unlocked)

**Expected Behavior**:
- Initial view: 9/9 total, 22% completed
- Unlocked: Best Practices (80%), Security Guardian (35%)
- Others show progress bars
- Click tab filters correctly
- Next milestone displays

**Achievement Details**:
```
Unlocked (2):
- Best Practices: 80% (gold checkmark)
- Security Guardian: 35% (gold checkmark)

Locked (7):
- Code Explorer: 10%
- Performance Optimizer: 40%
- Error Hunter: 25%
- Refactoring Master: 60%
- Documentation Expert: 15%
- Speed Demon: 50%
- Team Player: 0%
```

---

#### 6. AchievementBadge Component
**Path**: Part of AchievementsView (see above)

**Tests**:
- [ ] Badge displays icon or emoji
- [ ] Badge shows title text
- [ ] Badge shows progress percentage
- [ ] Locked achievements show lock icon
- [ ] Unlocked achievements show checkmark
- [ ] Progress bar fills correctly
- [ ] Color changes based on unlock status

**Expected Behavior**:
- Unlocked: Green background, checkmark visible
- Locked: Gray background, lock visible
- Progress bar shows 0-100% fill
- Responsive sizing in grid layout

---

#### 7. ErrorBoundary Component
**Path**: Wraps all features

**Tests**:
- [ ] Component prevents crashes
- [ ] Shows error UI on component error
- [ ] Displays error message
- [ ] "Try Again" button visible
- [ ] Clicking "Try Again" attempts recovery
- [ ] Error logged to console

**Expected Behavior**:
- If any feature throws error:
  - Shows "⚠️ Something Went Wrong"
  - Displays error message
  - Shows "Try Again" button
  - User can recover without reloading

---

#### 8. TodoTracker Priority Indicators
**Path**: Open feature "Todo Tracker"

**Tests**:
- [ ] High priority shows 🔴 icon
- [ ] Medium priority shows 🟡 icon
- [ ] Low priority shows 🟢 icon
- [ ] Unknown priority shows ⚪ icon
- [ ] Priority badge colors match icons
- [ ] All todos display with correct icons

**Expected Behavior**:
- Priority icons appear before each TODO
- Color-coded badges in correct colors
- Icons/colors match priority level
- Visual distinction is clear

---

## Automated Testing (Unit Tests)

### Test Structure
```bash
npm run test  # Run all tests
npm run test:watch  # Watch mode
```

### Test Files to Create
- `src/components/figma-ui/ErrorBoundary.test.tsx`
- `src/components/figma-ui/dashboard/ChatFeature.test.tsx`
- `src/components/figma-ui/dashboard/TestFeature.test.tsx`
- `src/components/figma-ui/dashboard/SnippetsFeature.test.tsx`
- `src/components/figma-ui/dashboard/QuickFixFeature.test.tsx`
- `src/components/figma-ui/dashboard/AchievementsView.test.tsx`
- `src/components/figma-ui/AchievementBadge.test.tsx`

---

## Integration Testing

### RightDashboard Feature Switching

**Test**: Feature Navigation
```
1. Open RightDashboard
2. Click "Code Chat" → ChatFeature loads
3. Click "Test Runner" → TestFeature loads
4. Click "Snippets" → SnippetsFeature loads
5. Click "Quick Fixes" → QuickFixFeature loads
6. Click "Achievements" → AchievementsView loads
```

**Expected**:
- Each feature loads without errors
- Previous feature unmounts
- No console errors
- Loading spinner appears briefly

---

### Error Boundary Testing

**Test**: Component Error Handling
```
1. Intentionally break a component (add syntax error)
2. Trigger error in ErrorBoundary
3. Error UI should display
4. Click "Try Again"
5. Component should recover or show error gracefully
```

**Expected**:
- App doesn't crash
- Error message displays
- Recovery is possible
- Console shows error log

---

## Performance Testing

### Bundle Size Analysis
```bash
npm run esbuild  # Check bundle sizes
```

**Expected Metrics**:
- Each component: < 100KB
- Total dashboard: < 500KB
- Lazy loading: Separate files for each feature

### Load Time Testing
```
1. Open extension
2. Measure time to render first feature
3. Measure time to switch between features
4. Check memory usage

Expected:
- Initial load: < 2 seconds
- Feature switch: < 500ms
- Memory: < 50MB for dashboard
```

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key activates buttons
- [ ] Escape key closes features
- [ ] Focus indicators visible

### Screen Reader Testing
- [ ] All buttons have labels
- [ ] Links are descriptive
- [ ] Images have alt text
- [ ] Role attributes set correctly

### Color Contrast
- [ ] Text readable on backgrounds
- [ ] Don't rely on color alone
- [ ] Priority indicators have text labels too

---

## Browser Testing (if applicable)

### VS Code Webview
- [ ] All features render correctly
- [ ] CSS applies properly
- [ ] JavaScript executes without errors
- [ ] VS Code theme integration works

### Different Themes
- [ ] Light theme: readable
- [ ] Dark theme: readable
- [ ] High contrast: colors distinguish

---

## Regression Testing

### Ensure Existing Features Still Work
- [ ] CommitGenerator loads
- [ ] LearningChatbot loads
- [ ] TodoTracker loads
- [ ] QuizRunner loads
- [ ] HelpPanel loads

---

## Known Limitations & Notes

### Current Behavior
1. **ChatFeature**: 
   - Returns mock response (API integration needed)
   - No actual AI provider in webview

2. **TestFeature**:
   - Uses mock test data
   - No actual test runner integration

3. **SnippetsFeature**:
   - Sample snippets only
   - No persistence

4. **QuickFixFeature**:
   - Sample fixes only
   - No actual code analysis

5. **AchievementsView**:
   - Hardcoded achievements
   - No progress persistence

### Future Enhancements
- Real API integrations
- Data persistence
- User preferences
- Achievement unlocking logic

---

## Troubleshooting

### Component Won't Load
```
1. Check browser console for errors
2. Verify component is exported
3. Check lazy import path
4. Verify TypeScript compilation (0 errors)
```

### Feature Buttons Don't Work
```
1. Check RightDashboard.tsx imports
2. Verify activeFeature names match
3. Check postToExtension function
4. Look for message bus errors
```

### Styles Not Applied
```
1. Verify Tailwind classes used
2. Check CSS bundling
3. Verify VS Code theme variables
4. Check z-index layering
```

### Error Boundary Issues
```
1. Check error boundary wrapping
2. Verify getDerivedStateFromError
3. Check componentDidCatch logging
4. Verify fallback UI renders
```

---

## Test Report Template

```markdown
## Phase 2 Test Report - [Date]

### Overall Status: PASS / FAIL

### Components Tested
- [ ] ErrorBoundary
- [ ] ChatFeature
- [ ] TestFeature
- [ ] SnippetsFeature
- [ ] QuickFixFeature
- [ ] AchievementsView
- [ ] AchievementBadge
- [ ] TodoTracker Priority Indicators

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Expected: [expected behavior]
   - Actual: [actual behavior]
   - Fix: [resolution]

### Pass Rate: X/Y tests passed

### Sign-Off
Tested by: [Name]
Date: [Date]
Notes: [Any additional notes]
```

---

## Summary

All Phase 2 components are ready for testing. Start with manual testing to verify functionality, then move to automated tests for regression prevention. Use this guide as your checklist for comprehensive coverage.

**Total Test Cases**: 50+
**Estimated Testing Time**: 2-3 hours (manual) + 1-2 hours (automated setup)

