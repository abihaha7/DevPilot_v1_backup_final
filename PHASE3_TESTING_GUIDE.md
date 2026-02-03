# Phase 3 Testing Guide

## Overview

This guide provides comprehensive testing procedures for all Phase 3 features. All tests are manual and can be performed in VS Code with DevPilot extension loaded.

**Total Test Cases**: 50+
**Estimated Testing Time**: 2-3 hours
**Success Criteria**: All tests pass without errors

---

## Pre-Testing Setup

### Requirements
- VS Code installed and running
- DevPilot extension loaded
- Access to command palette (Ctrl+Shift+P)
- At least one code file open (any language)

### Verification Steps
1. Open DevPilot extension in VS Code
2. Verify "DevPilot: Phase 3" shows 0 errors
3. Check that welcome sidebar displays on first load
4. Confirm all commands appear in command palette

---

## Test Suite 1: Command Palette Integration

### Test 1.1: Command Discovery
**Steps**:
1. Press `Ctrl+Shift+P` to open command palette
2. Type "devpilot" to see all DevPilot commands

**Expected Results**:
- ✓ All 8+ DevPilot commands visible
- ✓ Commands clearly grouped under "DevPilot:" prefix
- ✓ Icons display correctly if configured
- ✓ Quick access with keyboard navigation works

**Pass Criteria**: All commands visible and selectable

---

### Test 1.2: Open AI Chatbot Command
**Steps**:
1. Press `Ctrl+Shift+P`
2. Type "chatbot" and select "DevPilot: Open AI Chatbot"
3. Sidebar should focus and display chat interface

**Expected Results**:
- ✓ Command executes without errors
- ✓ Sidebar becomes active
- ✓ Chat interface appears (or welcome if no API key)
- ✓ No console errors in DevTools

**Pass Criteria**: Sidebar displays chatbot interface

---

### Test 1.3: Take a Quiz Command
**Steps**:
1. Press `Ctrl+Shift+P`
2. Type "quiz" and select "DevPilot: Take a Quiz"
3. Select a topic (HTML, CSS, or JavaScript)
4. Select a difficulty (Easy, Medium, Hard)

**Expected Results**:
- ✓ Quiz selection appears in new webview
- ✓ Can select topic and difficulty
- ✓ Quiz starts after selection
- ✓ Questions display correctly
- ✓ Progress bar shows completion status

**Pass Criteria**: Quiz loads and displays questions

---

### Test 1.4: Show Help Command
**Steps**:
1. Press `Ctrl+Shift+P`
2. Type "help" and select "DevPilot: Show Help"
3. Select a help topic from list

**Expected Results**:
- ✓ Help topics appear in input selection
- ✓ Selected topic displays in new webview
- ✓ Help content is formatted and readable
- ✓ Navigation back works
- ✓ Links open correctly (if any)

**Pass Criteria**: Help topics display and are readable

**Topics to Test**:
- [ ] Getting Started
- [ ] Using the Chatbot
- [ ] Taking Quizzes
- [ ] Managing TODOs
- [ ] Code Translation
- [ ] Keyboard Shortcuts
- [ ] Settings
- [ ] Advanced Features

---

### Test 1.5: Learning Streak Command
**Steps**:
1. Press `Ctrl+Shift+P`
2. Type "streak" and select "DevPilot: Check Learning Streak"

**Expected Results**:
- ✓ Current streak displays
- ✓ Longest streak displays
- ✓ Total points shown
- ✓ Last activity timestamp shown
- ✓ Message box appears with information

**Pass Criteria**: Streak information displays correctly

---

## Test Suite 2: Welcome Sidebar

### Test 2.1: Sidebar Display on Load
**Steps**:
1. Close DevPilot sidebar (if visible)
2. Click "DevPilot" in sidebar icons to reopen
3. Observe sidebar content

**Expected Results**:
- ✓ Welcome header displays with DevPilot logo
- ✓ "Welcome to DevPilot" text visible
- ✓ Feature grid shows 6 feature cards
- ✓ All content is properly styled
- ✓ No layout issues or overlaps

**Pass Criteria**: Welcome sidebar displays without layout issues

---

### Test 2.2: Feature Cards
**Steps**:
1. Sidebar open with welcome view
2. Observe each feature card (6 total):
   - AI Chatbot
   - Quizzes
   - TODO Tracker
   - Code Translation
   - Code Comparison
   - Achievements

**Expected Results**:
- ✓ Each card has emoji icon
- ✓ Card has title and description
- ✓ Cards are visually distinct
- ✓ Hover effects work (if enabled)
- ✓ Cards are readable with good contrast

**Pass Criteria**: All 6 feature cards visible and readable

---

### Test 2.3: Quick Command Buttons
**Steps**:
1. Sidebar open with welcome view
2. Scroll to "Quick Commands" section
3. Click each button (7 total)

**Expected Results**:
- ✓ Each button click executes corresponding command
- ✓ No errors in console
- ✓ Buttons are clearly labeled
- ✓ All 7 buttons present:
  - [ ] Chatbot
  - [ ] Quiz
  - [ ] TODOs
  - [ ] Translate
  - [ ] Compare Code
  - [ ] Help
  - [ ] Streak

**Pass Criteria**: All buttons execute commands correctly

---

### Test 2.4: Keyboard Shortcuts Display
**Steps**:
1. Sidebar open with welcome view
2. Scroll to "Keyboard Shortcuts" section
3. Verify each shortcut

**Expected Results**:
- ✓ At least 5 shortcuts displayed
- ✓ Keyboard key formatting is clear
- ✓ Descriptions are accurate
- ✓ Shortcuts are copy-paste friendly

**Pass Criteria**: Shortcuts section displays 5+ shortcuts clearly

---

### Test 2.5: Getting Started Guide
**Steps**:
1. Sidebar open with welcome view
2. Scroll to "Getting Started" section
3. Read through guide

**Expected Results**:
- ✓ 5-step guide visible
- ✓ Each step clearly explained
- ✓ Steps are in logical order
- ✓ Text is readable with good formatting

**Pass Criteria**: Getting started guide is clear and complete

---

## Test Suite 3: TODO Workflow

### Test 3.1: Create New TODO
**Steps**:
1. Press `Ctrl+Shift+P`
2. Type "create todo" and select "DevPilot: Create TODO"
3. Enter TODO text (e.g., "Fix login button")
4. Select priority (High, Medium, Low)
5. Complete creation

**Expected Results**:
- ✓ Input prompt appears
- ✓ Priority selection works
- ✓ TODO is created
- ✓ Confirmation message appears
- ✓ TODO appears in sidebar/list

**Pass Criteria**: New TODO created and visible

**Test Cases**:
- [ ] High priority TODO
- [ ] Medium priority TODO
- [ ] Low priority TODO
- [ ] TODO with special characters
- [ ] TODO with long text (>100 chars)

---

### Test 3.2: Show TODO Statistics
**Steps**:
1. Create at least 3 TODOs (if not already created)
2. Press `Ctrl+Shift+P`
3. Type "stats" and select "DevPilot: Show TODO Stats"

**Expected Results**:
- ✓ Statistics message appears
- ✓ Total count displayed
- ✓ Completion rate shown
- ✓ Priority breakdown visible
- ✓ Average time shown (if any completed)

**Pass Criteria**: Statistics display correctly

---

### Test 3.3: Change TODO Status
**Steps**:
1. Create at least one TODO
2. Press `Ctrl+Shift+P`
3. Type "status" and select "DevPilot: Change TODO Status"
4. Select a TODO from list
5. Select new status from options

**Expected Results**:
- ✓ TODO list appears in selection
- ✓ Status options appear (Pending, In Progress, Completed, Blocked)
- ✓ Status updates correctly
- ✓ Confirmation message appears
- ✓ TODO counter updates

**Pass Criteria**: TODO status changes work correctly

**Status Transitions to Test**:
- [ ] Pending → In Progress
- [ ] In Progress → Completed
- [ ] Completed → Pending (undo)
- [ ] Any → Blocked
- [ ] Blocked → Pending

---

### Test 3.4: TODO Persistence
**Steps**:
1. Create 2-3 TODOs
2. Close and reopen DevPilot sidebar
3. Close VS Code completely
4. Reopen VS Code with DevPilot
5. Check if TODOs still exist

**Expected Results**:
- ✓ TODOs persist after sidebar close/reopen
- ✓ TODOs persist after VS Code restart
- ✓ TODO data intact (text, priority, status)
- ✓ No data loss

**Pass Criteria**: TODOs persist across sessions

---

### Test 3.5: Delete TODO
**Steps**:
1. Create a test TODO
2. Find the delete option (varies by UI)
3. Delete the TODO
4. Verify removal

**Expected Results**:
- ✓ TODO is removed
- ✓ Confirmation message appears (if applicable)
- ✓ TODO count decreases
- ✓ Deletion persists after reload

**Pass Criteria**: TODO deletion works and persists

---

## Test Suite 4: Learning Streaks

### Test 4.1: Streak Initialization
**Steps**:
1. Fresh extension install (or clear global state if possible)
2. Execute any learning activity (quiz, help, etc.)
3. Check streak immediately after

**Expected Results**:
- ✓ Streak initializes to 1
- ✓ Points awarded (10+ per activity)
- ✓ Timestamp recorded
- ✓ Data persists to storage

**Pass Criteria**: Streak initializes and increments correctly

---

### Test 4.2: Daily Streak Increment
**Steps**:
1. Check current streak (note value)
2. Complete a learning activity
3. Check streak again within 1 minute

**Expected Results**:
- ✓ Streak increases by 1
- ✓ Points increase by 10+
- ✓ Timestamp updates
- ✓ Change reflects immediately

**Pass Criteria**: Daily activities increment streak correctly

---

### Test 4.3: Longest Streak Tracking
**Steps**:
1. Build up streak over multiple activities
2. Check "Check Streak" command
3. Verify longest streak vs current streak

**Expected Results**:
- ✓ Longest streak tracked separately
- ✓ Longest streak never decreases
- ✓ Current streak shown distinctly
- ✓ Both values display correctly

**Pass Criteria**: Longest streak tracking works

---

### Test 4.4: Streak Data Persistence
**Steps**:
1. Build up streak (5+ activities)
2. Close VS Code completely
3. Reopen and check streak

**Expected Results**:
- ✓ Streak persists after close
- ✓ Points persist
- ✓ Longest streak preserved
- ✓ Timestamps correct
- ✓ No data corruption

**Pass Criteria**: Streak data persists across sessions

---

## Test Suite 5: Inline Suggestions

### Test 5.1: JavaScript/TypeScript Suggestions
**Steps**:
1. Create a new JavaScript/TypeScript file
2. Add code with common issues:
   - Missing try-catch on async/await
   - console.log statements
   - var declarations
   - Magic numbers
3. Observe lightbulb suggestions

**Expected Results**:
- ✓ Lightbulbs appear on error lines
- ✓ Multiple suggestions available
- ✓ Suggestion titles are clear
- ✓ Detailed messages provided

**Test Cases**:
```javascript
// Missing try-catch (should suggest adding)
await fetchData();

// console.log (should suggest logging)
console.log("debug");

// var usage (should suggest const/let)
var x = 5;

// Magic number (should suggest extraction)
if (x > 100) { }
```

**Pass Criteria**: All JS/TS suggestions display correctly

---

### Test 5.2: Python Suggestions
**Steps**:
1. Create a Python file
2. Add code with Python-specific issues:
   - Missing type hints
   - print() vs logging
3. Observe suggestions

**Expected Results**:
- ✓ Python-specific suggestions appear
- ✓ Type hint suggestions provided
- ✓ Logging recommendations shown

**Test Code**:
```python
def process_data(data):  # Missing type hints
    print("Processing")  # Should use logging
    return result
```

**Pass Criteria**: Python suggestions work correctly

---

### Test 5.3: HTML Suggestions
**Steps**:
1. Create an HTML file
2. Add problematic HTML:
   - Image without alt text
   - Missing lang attribute
3. Observe suggestions

**Expected Results**:
- ✓ Accessibility suggestions appear
- ✓ alt text suggestions for images
- ✓ lang attribute suggestions
- ✓ Clear recommendations

**Test Code**:
```html
<html>
  <img src="photo.jpg" />
</html>
```

**Pass Criteria**: HTML accessibility suggestions work

---

### Test 5.4: CSS Suggestions
**Steps**:
1. Create a CSS file
2. Add problematic CSS:
   - Hardcoded colors
   - Missing media queries
3. Observe suggestions

**Expected Results**:
- ✓ CSS variable suggestions appear
- ✓ Responsive design recommendations
- ✓ Color extraction suggestions
- ✓ Media query recommendations

**Test Code**:
```css
.button {
  color: #FF5733;  /* Hardcoded color */
  font-size: 16px;
}
```

**Pass Criteria**: CSS suggestions work correctly

---

### Test 5.5: Universal Suggestions
**Steps**:
1. In any file, create:
   - Very long lines (>100 chars)
   - TODO/FIXME comments
2. Observe suggestions

**Expected Results**:
- ✓ Line length warnings appear
- ✓ TODO comments highlighted
- ✓ FIXME comments highlighted
- ✓ Clear improvement suggestions

**Pass Criteria**: Universal suggestions work across languages

---

## Test Suite 6: Code Translation

### Test 6.1: Basic Translation
**Steps**:
1. Open a JavaScript file with code
2. Select some code
3. Press `Ctrl+Shift+P`
4. Type "translate" and run command
5. Select source language (JavaScript)
6. Select target language (Python)

**Expected Results**:
- ✓ Translation completes
- ✓ New webview opens with comparison
- ✓ Original code shown on left
- ✓ Translated code shown on right
- ✓ Both are readable

**Pass Criteria**: Translation displays correctly

---

### Test 6.2: Multiple Language Pairs
**Steps**:
1. Test translation between different language pairs:
   - [ ] JavaScript → Python
   - [ ] JavaScript → Java
   - [ ] Python → JavaScript
   - [ ] TypeScript → Go
   - [ ] Java → C#

**Expected Results**:
- ✓ All language pairs work
- ✓ Syntax highlighted correctly
- ✓ Structure preserved
- ✓ Variable names translated appropriately

**Pass Criteria**: Multiple language translations work

---

### Test 6.3: Code Context Preservation
**Steps**:
1. Translate a function with:
   - Multiple parameters
   - Nested loops
   - Comments
   - Variable declarations
2. Verify translation preserves structure

**Expected Results**:
- ✓ Function signature translated correctly
- ✓ Logic preserved
- ✓ Comments translated
- ✓ Variable names consistent
- ✓ Indentation maintained

**Pass Criteria**: Code structure preserved in translation

---

## Test Suite 7: Integration Tests

### Test 7.1: Full Workflow - Learn & Create
**Steps**:
1. Take a quiz (builds streak)
2. Create TODO from quiz topic
3. View TODO stats
4. Mark TODO complete
5. Check streak

**Expected Results**:
- ✓ All systems interact correctly
- ✓ Streak tracks activities
- ✓ TODO reflected in stats
- ✓ No conflicts or errors
- ✓ Data persists

**Pass Criteria**: Full workflow completes without errors

---

### Test 7.2: Command Palette Consistency
**Steps**:
1. Execute same command 5 times
2. Each time verify results
3. Check for consistency

**Expected Results**:
- ✓ Same results each time
- ✓ No random errors
- ✓ Data accumulates correctly
- ✓ No state corruption

**Pass Criteria**: Commands behave consistently

---

### Test 7.3: Error Recovery
**Steps**:
1. Try invalid operations:
   - Invalid language for translation
   - Special characters in TODO
   - Extreme priority values
2. Observe error handling

**Expected Results**:
- ✓ Graceful error messages
- ✓ No crashes
- ✓ Users informed of issues
- ✓ Recovery options provided

**Pass Criteria**: Errors handled gracefully

---

### Test 7.4: Performance Test
**Steps**:
1. Create 20 TODOs
2. Check streak (many activities)
3. Run inline suggestions on large file
4. Measure responsiveness

**Expected Results**:
- ✓ Commands complete in <3 seconds
- ✓ No UI freezing
- ✓ Suggestions show within 500ms
- ✓ Persistence doesn't slow down

**Pass Criteria**: Performance acceptable at scale

---

## Test Suite 8: Edge Cases

### Test 8.1: Special Characters
**Steps**:
1. Create TODO with: émojis, Unicode, symbols
2. Translate code with special characters
3. Check suggestions with special cases

**Expected Results**:
- ✓ Proper character handling
- ✓ No encoding issues
- ✓ Display correctly
- ✓ Persist correctly

**Pass Criteria**: Special characters handled correctly

---

### Test 8.2: Large Data
**Steps**:
1. Create 50+ TODOs
2. Check stats performance
3. Large file (>5000 lines) suggestions
4. Large code translation

**Expected Results**:
- ✓ Stats calculate quickly
- ✓ Suggestions still work
- ✓ Translation handles large code
- ✓ No memory issues
- ✓ No UI blocking

**Pass Criteria**: Large data handled efficiently

---

### Test 8.3: Multiple Language Files
**Steps**:
1. Open files of different languages
2. Switch between them
3. Run suggestions on each
4. Verify language detection

**Expected Results**:
- ✓ Correct language detected
- ✓ Correct suggestions per language
- ✓ No cross-language interference
- ✓ Smooth switching

**Pass Criteria**: Multi-language handling works

---

## Regression Testing

### Test R.1: Phase 1 Features Still Work
- [ ] Refactoring suggestions still appear
- [ ] TODO achievement linking still works
- [ ] State broadcaster functioning
- [ ] Quick fix commands available

### Test R.2: Phase 2 Features Still Work
- [ ] Right dashboard still loads
- [ ] Chat feature accessible
- [ ] Test feature working
- [ ] Snippets feature available
- [ ] Quick fix feature functional
- [ ] Achievements viewable

### Test R.3: No Breaking Changes
- [ ] Extension loads without errors
- [ ] Previous settings preserved
- [ ] No compatibility issues
- [ ] Smooth upgrade path

---

## Final Verification Checklist

Before considering testing complete:

- [ ] All 50+ test cases passed
- [ ] 0 TypeScript errors in console
- [ ] 0 runtime errors in console
- [ ] All commands discoverable in palette
- [ ] All features functional
- [ ] Data persists across sessions
- [ ] Performance acceptable
- [ ] UI displays correctly
- [ ] Error messages clear and helpful
- [ ] Documentation accurate
- [ ] No regression in Phase 1/2 features
- [ ] All keyboard shortcuts work
- [ ] All button clicks work
- [ ] All integrations functional

---

## Known Limitations & Workarounds

(Will be filled during testing)

---

## Test Summary Report Template

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]
Status: [PASS/FAIL]

Passed: [#] / [#]
Failed: [#] / [#]
Issues: [#] / [#]

Issues Found:
1. [Issue]
   Severity: [Low/Medium/High]
   Status: [Resolved/Pending]
   
Notes:
[Additional notes]
```

---

## Contact & Support

For issues found during testing:
1. Document in format above
2. Create GitHub issue with details
3. Include test case that reproduces
4. Include error messages/logs

---

**Phase 3 Testing Guide - Complete**

