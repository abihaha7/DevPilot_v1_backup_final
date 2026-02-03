# Phase 4 Testing Guide

**Document Version**: 1.0  
**Test Coverage**: 50+ test cases  
**Difficulty**: Intermediate  
**Time to Complete**: 1-2 hours

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Dashboard Tests](#dashboard-tests)
4. [Comment Parser Tests](#comment-parser-tests)
5. [Editor Decoration Tests](#editor-decoration-tests)
6. [Hover Provider Tests](#hover-provider-tests)
7. [CodeLens Tests](#codelens-tests)
8. [Suggestion Filter Tests](#suggestion-filter-tests)
9. [Achievement System Tests](#achievement-system-tests)
10. [Integration Tests](#integration-tests)
11. [Edge Case Tests](#edge-case-tests)
12. [Performance Tests](#performance-tests)

---

## Prerequisites

- VS Code 1.90+ installed
- DevPilot extension installed and activated
- TypeScript files in workspace
- Python files in workspace (for language testing)
- All Phase 4 systems compiled (0 errors)

### Verification

```bash
cd c:\Users\user\DevPilot_v1
npm run compile     # Should show 0 errors
npm run build       # Should complete successfully
```

---

## Environment Setup

### 1. Create Test Workspace

```bash
# Create test project directory
mkdir devpilot-test-workspace
cd devpilot-test-workspace

# Create subdirectories
mkdir src
mkdir tests
mkdir docs
```

### 2. Create Test Files

#### JavaScript Test File (src/test.js)
```javascript
// TODO: Implement validation logic
const validateUser = (user) => {
  console.log("Validating user:", user);
  
  // FIXME: Security issue - hardcoded password
  const password = "admin123";
  
  /* HACK: Temporary solution
   * Need to refactor this properly
   */
  return user && user.id > 0;
};

// TODO: Add error handling
const processData = async (data) => {
  const result = await fetch('/api/data');
  return result.json();
};
```

#### Python Test File (src/test.py)
```python
# TODO: Add type hints
def calculate_average(numbers):
    # TODO: Add input validation
    print("Calculating average:", numbers)
    
    # FIXME: Handle empty list
    total = sum(numbers)
    return total / len(numbers)

# TODO: Move to logging module
def log_message(msg):
    print("LOG:", msg)

# HACK: Temporary test data
test_data = [1, 2, 3, 4, 5]
```

#### TypeScript Test File (src/test.ts)
```typescript
// TODO: Add comprehensive tests
interface User {
  id: number;
  name: string;
}

// FIXME: Type mismatch in return
const getUser = async (id: number): Promise<User> => {
  console.log("Fetching user:", id);
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// TODO: Implement pagination
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/users');
  return response.json();
};
```

#### Go Test File (src/test.go)
```go
package main

// TODO: Add error handling for database connection
func ConnectDatabase() error {
  // Connect to database
  return nil
}

// FIXME: Memory leak in goroutine
func ProcessRequest() {
  go func() {
    // Process request
  }()
}

// TODO: Add logging
func LogError(err error) {
  // Log error
}
```

### 3. Open in VS Code

```bash
code .
```

---

## Dashboard Tests

### Test Case D-1: Dashboard Panel Appears

**Objective**: Verify dashboard loads in left sidebar

**Steps**:
1. Open DevPilot workspace
2. Look at Activity Bar (left side)
3. Click DevPilot icon (rocket)
4. Look for "Dashboard" in views

**Expected Result**: 
- Dashboard view appears in sidebar
- Shows "Dashboard" tab
- Contains 6 sections (TODOs, Streak, Suggestions, Actions)

**Status**: ⬜ Not Started

---

### Test Case D-2: Dashboard Auto-Refresh

**Objective**: Verify dashboard updates every 5 seconds

**Steps**:
1. Open dashboard in sidebar
2. Note current TODO count
3. Open src/test.js
4. Wait 5 seconds
5. Observe dashboard updates

**Expected Result**:
- Dashboard stats update automatically
- TODO count increases when file opened
- No manual refresh needed

**Status**: ⬜ Not Started

---

### Test Case D-3: Dashboard Quick Actions

**Objective**: Verify quick action buttons work

**Steps**:
1. Open dashboard
2. Click "New TODO" button (✓ icon)
3. Enter: "Test quick action"
4. Confirm
5. Check dashboard updates

**Expected Result**:
- Input dialog appears
- TODO created immediately
- Dashboard shows new count

**Status**: ⬜ Not Started

---

### Test Case D-4: Dashboard Statistics Accuracy

**Objective**: Verify TODO statistics are correct

**Setup**:
- Create 10 TODOs in open files
- Mark 4 as complete

**Steps**:
1. Open dashboard
2. Check TODO count (should be 10)
3. Check completion % (should be 40%)
4. Check progress bar accuracy

**Expected Result**:
- Count matches actual TODOs
- Percentage is correct
- Progress bar visually accurate

**Status**: ⬜ Not Started

---

### Test Case D-5: Dashboard Learning Streak

**Objective**: Verify streak tracking

**Steps**:
1. Open dashboard
2. Look for "Learning Streak" section
3. Check "Current", "Best", and "Points"
4. Run `devpilot.trackLearningActivity` command

**Expected Result**:
- Streak displayed correctly
- Points accumulate when activity tracked
- Best streak persists

**Status**: ⬜ Not Started

---

## Comment Parser Tests

### Test Case CP-1: JavaScript Comments

**Objective**: Detect TODO in JavaScript comments

**Setup**: src/test.js open

**Steps**:
1. Add new comment: `// TODO: Test parser`
2. Wait 1 second
3. Check decorations in gutter
4. Check TODO workflow for new TODO

**Expected Result**:
- Gutter shows orange indicator (◐)
- TODO appears in TODO list
- Text matches comment

**Status**: ⬜ Not Started

---

### Test Case CP-2: Python Comments

**Objective**: Detect TODO in Python comments

**Setup**: src/test.py open

**Steps**:
1. Add new comment: `# TODO: Test Python parser`
2. Wait 1 second
3. Check gutter decoration
4. Verify TODO created

**Expected Result**:
- Parser recognizes Python comment
- Decoration appears
- TODO created

**Status**: ⬜ Not Started

---

### Test Case CP-3: Multi-line Comments (JavaScript)

**Objective**: Parse TODOs in multi-line comments

**Setup**: src/test.js

**Steps**:
1. Add: `/* TODO: Multi-line test */`
2. Wait for parser
3. Check gutter

**Expected Result**:
- Multi-line comment recognized
- TODO created from extracted text

**Status**: ⬜ Not Started

---

### Test Case CP-4: Priority Detection - FIXME

**Objective**: Detect FIXME as high priority

**Setup**: src/test.js

**Steps**:
1. Add: `// FIXME: High priority bug`
2. Wait for parser
3. Check gutter indicator

**Expected Result**:
- Gutter shows red indicator (●)
- TODO marked as HIGH priority
- Color is red (#ff5555)

**Status**: ⬜ Not Started

---

### Test Case CP-5: Priority Detection - HACK

**Objective**: Detect HACK as low priority

**Setup**: src/test.js

**Steps**:
1. Add: `// HACK: Temporary solution`
2. Wait for parser
3. Check gutter

**Expected Result**:
- Gutter shows blue indicator (○)
- TODO marked as LOW priority
- Color is blue (#0099cc)

**Status**: ⬜ Not Started

---

### Test Case CP-6: Auto-Delete on Comment Removal

**Objective**: TODO deleted when comment removed

**Setup**: src/test.js with existing TODO

**Steps**:
1. Verify TODO exists in list
2. Delete the comment line
3. Save file
4. Check TODO list

**Expected Result**:
- TODO removed from list when comment deleted
- Bidirectional sync works

**Status**: ⬜ Not Started

---

### Test Case CP-7: Language Coverage - Go

**Objective**: Parser supports Go comments

**Setup**: src/test.go open

**Steps**:
1. Add: `// TODO: Test Go parsing`
2. Wait for parser
3. Check gutter

**Expected Result**:
- Go comment recognized
- TODO created successfully

**Status**: ⬜ Not Started

---

### Test Case CP-8: Comment with No TODO Keyword

**Objective**: Normal comments ignored

**Setup**: src/test.js

**Steps**:
1. Add: `// This is a normal comment`
2. Wait
3. Check TODO list

**Expected Result**:
- No TODO created
- Comment ignored correctly

**Status**: ⬜ Not Started

---

### Test Case CP-9: HTML Comments

**Objective**: Parse HTML comments

**Setup**: Create src/test.html with:
```html
<!-- TODO: Update form -->
<div>Test</div>
```

**Steps**:
1. Open file
2. Wait for parser
3. Check TODO created

**Expected Result**:
- HTML comment recognized
- TODO created

**Status**: ⬜ Not Started

---

### Test Case CP-10: CSS Comments

**Objective**: Parse CSS comments

**Setup**: Create src/test.css with:
```css
/* TODO: Mobile responsive */
body { color: black; }
```

**Steps**:
1. Open file
2. Check parser recognizes CSS
3. Verify TODO created

**Expected Result**:
- CSS comment recognized
- TODO created

**Status**: ⬜ Not Started

---

## Editor Decoration Tests

### Test Case ED-1: Decoration Visible in Gutter

**Objective**: TODO decorations show in editor gutter

**Setup**: src/test.js with TODO comment

**Steps**:
1. Open src/test.js
2. Look at left margin (gutter)
3. Find line with TODO comment

**Expected Result**:
- Colored circle appears in gutter
- Color matches priority (red/orange/blue)
- Position aligns with TODO comment

**Status**: ⬜ Not Started

---

### Test Case ED-2: Priority Color Coding

**Objective**: Verify color matches priority

**Setup**: src/test.js with FIXME, TODO, HACK

**Steps**:
1. Create three TODOs with different priorities
2. Observe gutter colors
3. Verify: FIXME=red, TODO=orange, HACK=blue

**Expected Result**:
- FIXME: Red (#ff5555) - ●
- TODO: Orange (#ffbb33) - ◐
- HACK: Blue (#0099cc) - ○

**Status**: ⬜ Not Started

---

### Test Case ED-3: Decoration Tooltip on Hover

**Objective**: Hover shows TODO details

**Setup**: src/test.js with TODO

**Steps**:
1. Open src/test.js
2. Hover over gutter decoration
3. Wait for tooltip

**Expected Result**:
- Tooltip appears showing:
  - TODO text
  - Priority emoji
  - Status
  - Quick action buttons

**Status**: ⬜ Not Started

---

### Test Case ED-4: Override Ruler Indicator

**Objective**: Override ruler (right side) shows indicator

**Setup**: src/test.js with TODOs on different lines

**Steps**:
1. Open src/test.js
2. Look at right side of editor (overview ruler)
3. Check for small color indicators

**Expected Result**:
- Right edge shows colored marks
- Colors correspond to decorations
- Provides visual map of TODOs

**Status**: ⬜ Not Started

---

### Test Case ED-5: Real-time Decoration Update

**Objective**: Decorations update when text changes

**Setup**: src/test.js

**Steps**:
1. Edit TODO comment text
2. Observe gutter
3. Add new TODO comment
4. Check decoration appears

**Expected Result**:
- Decorations update immediately
- No lag or manual refresh needed

**Status**: ⬜ Not Started

---

### Test Case ED-6: Background Highlighting

**Objective**: TODO lines have background color

**Setup**: src/test.js with TODO

**Steps**:
1. Open file
2. Find TODO line
3. Check line background

**Expected Result**:
- Background slightly highlighted
- Color matches priority
- Subtle, not overwhelming

**Status**: ⬜ Not Started

---

### Test Case ED-7: Multiple TODOs on One Line

**Objective**: Handle multiple TODOs on same line

**Setup**: Add to src/test.js:
```javascript
// TODO: First TODO // TODO: Second TODO
```

**Steps**:
1. Check gutter decoration
2. Verify both TODOs created

**Expected Result**:
- Handles edge case gracefully
- Both TODOs detected
- Decoration appears

**Status**: ⬜ Not Started

---

### Test Case ED-8: Decoration on File Switch

**Objective**: Decorations update when switching files

**Setup**: src/test.js and src/test.py both with TODOs

**Steps**:
1. Open src/test.js (with TODOs)
2. Switch to src/test.py
3. Observe decorations change
4. Switch back

**Expected Result**:
- Decorations update per active file
- Previous file decorations removed
- New file decorations show

**Status**: ⬜ Not Started

---

## Hover Provider Tests

### Test Case HP-1: TODO Hover Tooltip

**Objective**: Hover on TODO shows interactive tooltip

**Setup**: src/test.js with TODO

**Steps**:
1. Hover over TODO line
2. Wait for hover provider to activate
3. Observe tooltip

**Expected Result**:
- Tooltip appears with:
  - Priority indicator (emoji)
  - TODO text
  - Current status
  - Action buttons (✓ Edit Delete)

**Status**: ⬜ Not Started

---

### Test Case HP-2: Mark TODO Complete Action

**Objective**: Click "Mark Done" in hover

**Setup**: src/test.js with uncompleted TODO

**Steps**:
1. Hover on TODO
2. Click "✓ Mark Done" button
3. Verify TODO marked complete

**Expected Result**:
- Command executes
- TODO status changes to "Done"
- Decoration updates (strikethrough or faded)

**Status**: ⬜ Not Started

---

### Test Case HP-3: Edit TODO Action

**Objective**: Click "Edit" in hover

**Setup**: src/test.js with TODO

**Steps**:
1. Hover on TODO
2. Click "✏️ Edit" button
3. Edit text in dialog
4. Confirm

**Expected Result**:
- Edit dialog appears
- Text updated in TODO list
- Hover shows new text

**Status**: ⬜ Not Started

---

### Test Case HP-4: Delete TODO Action

**Objective**: Click "Delete" in hover

**Setup**: src/test.js with TODO

**Steps**:
1. Hover on TODO
2. Click "🗑️ Delete" button
3. Confirm deletion

**Expected Result**:
- TODO removed from list
- Gutter decoration disappears
- Comment still in file (manual removal)

**Status**: ⬜ Not Started

---

### Test Case HP-5: Suggestion Hover - console.log

**Objective**: Hover on console.log shows suggestion

**Setup**: src/test.js with:
```javascript
console.log("debug");
```

**Steps**:
1. Hover over console.log
2. Observe suggestion

**Expected Result**:
- Hover shows suggestion
- Explains why (debug code)
- Offers quick fix

**Status**: ⬜ Not Started

---

### Test Case HP-6: Suggestion Hover - var Declaration

**Objective**: Hover on var shows style suggestion

**Setup**: src/test.js with:
```javascript
var myVar = 5;
```

**Steps**:
1. Hover over var
2. Check suggestion

**Expected Result**:
- Suggests using const/let
- Explains scoping benefits

**Status**: ⬜ Not Started

---

### Test Case HP-7: Multiple Hovers

**Objective**: Different hovers on different lines

**Setup**: src/test.js with multiple items

**Steps**:
1. Hover on TODO
2. Move to console.log
3. Move back to TODO
4. Verify correct context

**Expected Result**:
- Each hover shows correct context
- No stale information
- Proper cleanup

**Status**: ⬜ Not Started

---

### Test Case HP-8: Hover Command Links

**Objective**: Command links in hover are executable

**Setup**: src/test.js with TODO

**Steps**:
1. Hover on TODO
2. Click action button link
3. Verify command executes

**Expected Result**:
- Command links are clickable
- Commands execute properly
- isTrusted security works

**Status**: ⬜ Not Started

---

## CodeLens Tests

### Test Case CL-1: File-Level TODO Lens

**Objective**: Show TODO summary above file

**Setup**: src/test.js with 3 TODOs, 1 complete

**Steps**:
1. Open src/test.js
2. Look at line 1 (above code)
3. Check for CodeLens

**Expected Result**:
- Shows: "📋 2 Active | 1 Done"
- Aggregates all TODOs in file
- Updates when TODOs change

**Status**: ⬜ Not Started

---

### Test Case CL-2: Per-TODO CodeLens

**Objective**: Show status above each TODO

**Setup**: src/test.js with TODOs

**Steps**:
1. Open file
2. Find each TODO line
3. Check CodeLens above

**Expected Result**:
- Shows status icon (✅ 🔄 🚫 ⭕)
- Shows priority emoji (🔴 🟡 🟢)
- Shows TODO text

**Status**: ⬜ Not Started

---

### Test Case CL-3: CodeLens Quick Pick Menu

**Objective**: Click CodeLens shows action menu

**Setup**: src/test.js with TODO

**Steps**:
1. Click CodeLens above TODO
2. Observe quick pick menu
3. Select "Mark Done"

**Expected Result**:
- Menu shows 5 options:
  - Mark Done
  - In Progress
  - Blocked
  - Edit
  - Delete
- Action executes

**Status**: ⬜ Not Started

---

### Test Case CL-4: Suggestion CodeLens

**Objective**: Show code improvement suggestions

**Setup**: src/test.js with suggestions

**Steps**:
1. Add: `await fetch(url);` (without try-catch)
2. Look for CodeLens
3. Check suggestion text

**Expected Result**:
- Shows: "💡 Add try-catch"
- Language-specific suggestion
- Actionable

**Status**: ⬜ Not Started

---

### Test Case CL-5: CodeLens for Different Languages

**Objective**: CodeLens works across languages

**Setup**: src/test.py and src/test.js

**Steps**:
1. Open src/test.js (check JS suggestions)
2. Open src/test.py (check Python suggestions)
3. Verify language-specific suggestions

**Expected Result**:
- JavaScript: console.log, await suggestions
- Python: print() suggestion
- Each language has proper suggestions

**Status**: ⬜ Not Started

---

### Test Case CL-6: CodeLens Click Action

**Objective**: CodeLens suggestion is clickable

**Setup**: src/test.js with suggestion

**Steps**:
1. Click suggestion CodeLens
2. Verify action executes

**Expected Result**:
- Shows action menu or applies fix
- Command executes properly

**Status**: ⬜ Not Started

---

### Test Case CL-7: CodeLens Update on Edit

**Objective**: CodeLens updates when code changes

**Setup**: src/test.js

**Steps**:
1. Open file
2. Note CodeLens
3. Add new TODO comment
4. Check CodeLens updates

**Expected Result**:
- File-level lens updates immediately
- New per-line lenses appear
- No manual refresh needed

**Status**: ⬜ Not Started

---

## Suggestion Filter Tests

### Test Case SF-1: Relevance Scoring

**Objective**: Verify scoring algorithm

**Setup**: src/test.js with various issues

**Steps**:
1. Create several code patterns
2. Run filter on each
3. Check scoring calculations

**Expected Result**:
- Scoring ranges 0-100
- High-value suggestions > 70
- Low-value suggestions < 50

**Status**: ⬜ Not Started

---

### Test Case SF-2: Language Match Scoring

**Objective**: Language match affects score

**Setup**: src/test.js (JavaScript)

**Steps**:
1. Suggestion for JavaScript feature
2. Check base score + 15 for match
3. Compare to non-JS suggestion

**Expected Result**:
- JavaScript suggestion scores higher
- Language match adds +15 points
- Relevance improves

**Status**: ⬜ Not Started

---

### Test Case SF-3: Rate Limiting

**Objective**: Same suggestion not repeated quickly

**Setup**: src/test.js

**Steps**:
1. Get suggestion A
2. Change code slightly
3. Get suggestion A again (within 60s)
4. Check if blocked

**Expected Result**:
- Same suggestion blocked if < 60s apart
- Rate limit prevents spam
- Different suggestions show

**Status**: ⬜ Not Started

---

### Test Case SF-4: Max 3 Suggestions Per File

**Objective**: Only 3 suggestions shown per file

**Setup**: src/test.js with 6+ potential suggestions

**Steps**:
1. Open file with many issues
2. Count suggestions shown
3. Verify limit

**Expected Result**:
- Maximum 3 suggestions shown
- Top 3 by relevance score
- Others filtered out

**Status**: ⬜ Not Started

---

### Test Case SF-5: Over-Suggestion Penalty

**Objective**: Penalty applied for over-suggested items

**Setup**: File with repeated issue

**Steps**:
1. Show suggestion A multiple times
2. Check score penalties
3. Verify eventual suppression

**Expected Result**:
- Score decreases with repetition
- Penalty of -20 for over-suggested
- Eventually not shown

**Status**: ⬜ Not Started

---

### Test Case SF-6: Already-Addressed Detection

**Objective**: Penalty if code already handles it

**Setup**: src/test.js with:
```javascript
try {
  await fetch(url);
} catch (e) {
  // handled
}
```

**Steps**:
1. Check suggestion for this code
2. Verify no suggestion shown
3. Check -50 penalty applied

**Expected Result**:
- No suggestion for handled code
- Penalty of -50 if triggered
- Smart detection works

**Status**: ⬜ Not Started

---

### Test Case SF-7: Context Relevance

**Objective**: Context affects suggestion showing

**Setup**: src/test.js with:
```javascript
const users = []; // async code nearby
```

**Steps**:
1. Check suggestions relevance
2. Async suggestions more relevant
3. Non-async suggestions less relevant

**Expected Result**:
- Context-aware scoring
- Higher score for matching context
- +10 bonus for context match

**Status**: ⬜ Not Started

---

### Test Case SF-8: Smart Caching

**Objective**: Cache prevents recalculation

**Setup**: Multiple suggestions in file

**Steps**:
1. Get suggestions for file A
2. Reopen file A
3. Check cache hit (fast)
4. Open file B

**Expected Result**:
- Cached suggestions return quickly
- Cache size limited to 20 files
- LRU eviction works

**Status**: ⬜ Not Started

---

### Test Case SF-9: Filter Settings Command

**Objective**: Configure filter settings

**Setup**: VS Code with extension

**Steps**:
1. Run: `devpilot.configureSuggestions`
2. Input new min relevance: 70
3. Apply changes
4. Check filtering updates

**Expected Result**:
- Settings dialog appears
- Settings saved
- Filtering behavior changes

**Status**: ⬜ Not Started

---

### Test Case SF-10: Type Scoring Differences

**Objective**: Different suggestion types score differently

**Setup**: src/test.js with multiple issue types

**Steps**:
1. Error prevention issue (e.g., unhandled exception)
2. Performance issue (e.g., inefficient loop)
3. Style issue (e.g., variable name)
4. Compare scores

**Expected Result**:
- Error prevention: +25 (highest)
- Performance: +15
- Style: +5
- Priority ordering correct

**Status**: ⬜ Not Started

---

## Achievement System Tests

### Test Case AS-1: Achievement Detection

**Objective**: System detects achievement unlock

**Setup**: Start with 0 achievements

**Steps**:
1. Complete 1 TODO
2. Check achievement progress
3. Complete 9 more TODOs (10 total)
4. Verify "TODO Master" unlocks

**Expected Result**:
- Achievement unlocked after 10 TODOs
- Notification shown (or sidebar update)
- Achievement marked as unlocked

**Status**: ⬜ Not Started

---

### Test Case AS-2: Tier Progression

**Objective**: Tiers progress with points

**Setup**: Check current tier

**Steps**:
1. Earn 100 points total
2. Check tier (should be Silver)
3. Earn 150 more (250 total)
4. Check tier (should be Gold)

**Expected Result**:
- Bronze: 0-99 points
- Silver: 100-249 points
- Gold: 250-499 points
- Platinum: 500+ points
- Automatic tier progression

**Status**: ⬜ Not Started

---

### Test Case AS-3: Achievement Progress Tracking

**Objective**: Progress visible toward locked achievements

**Setup**: Start with no achievements

**Steps**:
1. Open achievements view
2. Find locked achievement
3. Check progress bar
4. Complete partial requirement
5. Observe progress update

**Expected Result**:
- Progress bar shows 0-100%
- Updates as you work
- Shows path to unlock

**Status**: ⬜ Not Started

---

### Test Case AS-4: Persistence Across Sessions

**Objective**: Achievements survive reload

**Setup**: Unlock one achievement

**Steps**:
1. Unlock "First Streak"
2. Close VS Code completely
3. Reopen
4. Check achievements still unlocked

**Expected Result**:
- Achievements persist in globalState
- Survive editor restart
- Data not lost

**Status**: ⬜ Not Started

---

### Test Case AS-5: 16 Achievements Listed

**Objective**: All 16 achievements available

**Setup**: Open achievements view

**Steps**:
1. List all achievements
2. Count total
3. Verify 16 present

**Expected Result**:
- 16 total achievements listed
- 4 tiers represented
- All descriptions clear

**Status**: ⬜ Not Started

---

### Test Case AS-6: Bronze Tier Achievements

**Objective**: All 5 bronze achievements

**Setup**: Start fresh

**Steps**:
1. Complete requirements for each:
   - First Streak (3+ days)
   - TODO Master (10 TODOs)
   - Quiz Enthusiast (5 quizzes)
   - Code Doctor (5 quick fixes)
   - Point Collector (50 points)

**Expected Result**:
- All 5 bronze achievements unlock
- Progress tracked correctly

**Status**: ⬜ Not Started

---

### Test Case AS-7: Silver Tier Achievements

**Objective**: Silver achievements unlock after 100 points

**Setup**: Earn 100+ points

**Steps**:
1. Reach 100 points
2. Check tier = Silver
3. Complete silver requirements
4. Verify unlocks

**Expected Result**:
- Silver achievements visible
- Tier clearly Silver
- Achievements unlock on requirement match

**Status**: ⬜ Not Started

---

### Test Case AS-8: Streak Achievement

**Objective**: Streak achievements unlock correctly

**Setup**: Track streak

**Steps**:
1. Use extension daily for 3 days
2. Check "First Streak" unlocks
3. Continue to 7 days
4. Check "Week Warrior" unlocks
5. Continue to 30 days
6. Check "Month Master" unlocks

**Expected Result**:
- Streaks unlock at 3, 7, 30, 100 days
- Progress tracked daily
- Correct tier assignment

**Status**: ⬜ Not Started

---

### Test Case AS-9: Quiz Achievement

**Objective**: Quiz-based achievements work

**Setup**: Take quizzes

**Steps**:
1. Take 1-4 quizzes
2. Check "Quiz Enthusiast" locks (needs 5)
3. Take 5th quiz
4. Verify unlock

**Expected Result**:
- Progress toward 5, 15, 30 quizzes
- Achievements unlock properly

**Status**: ⬜ Not Started

---

### Test Case AS-10: Points Achievement

**Objective**: Points-based achievements

**Setup**: Earn points through activities

**Steps**:
1. Earn points via TODOs, quizzes, fixes
2. Track total points
3. Unlock "Point Collector" at 50
4. "Point Hoarder" at 250
5. "Elite Achiever" at 500

**Expected Result**:
- Points accumulate correctly
- Achievements unlock at thresholds
- Tier progresses with points

**Status**: ⬜ Not Started

---

## Integration Tests

### Test Case INT-1: Extension Starts Without Errors

**Objective**: Phase 4 initialization succeeds

**Steps**:
1. Close VS Code completely
2. Reopen
3. Check activation logs

**Expected Result**:
- No errors in output
- All Phase 4 systems register:
  - Dashboard panel ✓
  - Comment parser ✓
  - Decorations ✓
  - Hover providers ✓
  - CodeLens ✓
  - Suggestion filter ✓
  - Achievement system ✓
- Console shows "DevPilot ready!"

**Status**: ⬜ Not Started

---

### Test Case INT-2: Dashboard + TODO Workflow Sync

**Objective**: Dashboard updates when TODO workflow changes

**Setup**: Dashboard visible

**Steps**:
1. Create TODO via workflow
2. Check dashboard updates count
3. Complete TODO
4. Check dashboard updates percentage

**Expected Result**:
- Dashboard reflects TODO changes
- Real-time sync works
- No manual refresh needed

**Status**: ⬜ Not Started

---

### Test Case INT-3: Comment Parser + TODO Workflow Sync

**Objective**: Parsed comments create workflow TODOs

**Setup**: src/test.js with comment

**Steps**:
1. Add: `// TODO: Test`
2. Open TODO workflow
3. Find newly created TODO
4. Verify text matches comment

**Expected Result**:
- Comment creates workflow TODO
- Text preserved exactly
- Bidirectional sync works

**Status**: ⬜ Not Started

---

### Test Case INT-4: Decorations + Workflow Status Sync

**Objective**: Decorations update with workflow status

**Setup**: src/test.js with TODO

**Steps**:
1. Check decoration (active status)
2. Mark TODO complete in workflow
3. Check decoration updates
4. Verify completion indicator

**Expected Result**:
- Decorations reflect status changes
- Visual feedback matches workflow
- Real-time updates

**Status**: ⬜ Not Started

---

### Test Case INT-5: All Phases Working Together

**Objective**: Phase 1-4 all work together

**Steps**:
1. Create file (Phase 1 analysis)
2. Open in dashboard (Phase 4 dashboard)
3. See decorations (Phase 4 decorations)
4. Hover for actions (Phase 4 hover)
5. Run command from Phase 2
6. Get suggestion from Phase 3
7. See filtered in Phase 4

**Expected Result**:
- All phases work together
- No conflicts or interference
- Seamless user experience

**Status**: ⬜ Not Started

---

### Test Case INT-6: Command Routing

**Objective**: Dashboard commands execute properly

**Setup**: Dashboard visible

**Steps**:
1. Click "New TODO" button
2. Enter text
3. Confirm
4. Check TODO created

**Expected Result**:
- Command routes to correct handler
- Executes without error
- UI updates reflect change

**Status**: ⬜ Not Started

---

### Test Case INT-7: State Management

**Objective**: Global state properly maintained

**Steps**:
1. Close file with TODOs
2. Close all files
3. Reopen file
4. Check TODOs still there

**Expected Result**:
- State persists across sessions
- Decorations reappear
- Achievements remember

**Status**: ⬜ Not Started

---

### Test Case INT-8: Multi-File Operations

**Objective**: Phase 4 works across multiple files

**Setup**: src/test.js, src/test.py, src/test.ts

**Steps**:
1. Add TODOs to each file
2. Switch between files rapidly
3. Check decorations update
4. Check dashboard counts all
5. Check suggestions per language

**Expected Result**:
- No interference between files
- Decorations switch correctly
- Dashboard aggregates all TODOs
- Suggestions language-specific

**Status**: ⬜ Not Started

---

## Edge Case Tests

### Test Case EC-1: Empty File

**Objective**: Handle file with no TODOs

**Setup**: Create empty src/empty.js

**Steps**:
1. Open empty file
2. Check decorations (none)
3. Check dashboard count (0)
4. Check suggestions shown

**Expected Result**:
- No errors
- Graceful handling
- Dashboard shows 0

**Status**: ⬜ Not Started

---

### Test Case EC-2: Very Large File

**Objective**: Handle 1000+ line file

**Setup**: Create large src/large.js

**Steps**:
1. Add 50+ TODOs to file
2. Open file
3. Check performance
4. Scroll through file

**Expected Result**:
- No significant lag
- Decorations render properly
- Dashboard updates
- Performance acceptable

**Status**: ⬜ Not Started

---

### Test Case EC-3: Special Characters in TODO

**Objective**: Handle special characters

**Setup**: Add to src/test.js:
```javascript
// TODO: Check & validate (email@example.com) [urgent]
```

**Steps**:
1. Check parsing works
2. Verify text preserved
3. Check no encoding issues

**Expected Result**:
- Special chars handled
- Text preserved exactly
- No parsing errors

**Status**: ⬜ Not Started

---

### Test Case EC-4: Unicode in TODO

**Objective**: Handle Unicode characters

**Setup**: Add to src/test.js:
```javascript
// TODO: 修复 bug (中文) emoji 🐛
```

**Steps**:
1. Check parsing
2. Verify display
3. Check no corruption

**Expected Result**:
- Unicode preserved
- Displays correctly
- No encoding issues

**Status**: ⬜ Not Started

---

### Test Case EC-5: Very Long TODO Text

**Objective**: Handle long text

**Setup**: Add 200-char TODO

**Steps**:
1. Create long TODO comment
2. Check parsing
3. Check display in hover/CodeLens

**Expected Result**:
- Truncated gracefully
- Hover shows full text
- No UI breaking

**Status**: ⬜ Not Started

---

### Test Case EC-6: Rapid File Changes

**Objective**: Handle rapid edits

**Setup**: src/test.js

**Steps**:
1. Rapidly add/remove TODOs
2. Type quickly
3. Change text fast
4. Monitor decorations

**Expected Result**:
- Debounced updates (no lag)
- Decorations eventually consistent
- No crashes or errors

**Status**: ⬜ Not Started

---

### Test Case EC-7: Tab and Spaces Mix

**Objective**: Handle mixed indentation

**Setup**: src/test.js with tabs and spaces

**Steps**:
1. Add TODOs with mixed indentation
2. Check parsing works
3. Check decoration alignment

**Expected Result**:
- Handles mixed indentation
- Decorations align properly
- No parsing issues

**Status**: ⬜ Not Started

---

### Test Case EC-8: Nested Comments (JS)

**Objective**: Handle nested/adjacent comments

**Setup**: src/test.js with:
```javascript
// TODO: First
// FIXME: Second (adjacent)
/* TODO: Third (block) */
```

**Steps**:
1. Check all parsed correctly
2. Verify correct priorities
3. Check no duplication

**Expected Result**:
- All TODOs found
- Correct priority assigned
- No duplicates

**Status**: ⬜ Not Started

---

### Test Case EC-9: Syntax Error in File

**Objective**: Parser handles syntax errors

**Setup**: src/test.js with syntax error:
```javascript
// TODO: This is valid
if (true { // syntax error here
```

**Steps**:
1. Open malformed file
2. Check TODOs still parsed
3. Check no crash

**Expected Result**:
- Still parses comments correctly
- Doesn't crash on syntax error
- Decorations still work

**Status**: ⬜ Not Started

---

### Test Case EC-10: File Encoding Issues

**Objective**: Handle different encodings

**Setup**: Create file with UTF-8 BOM

**Steps**:
1. Open file
2. Check parsing works
3. Check no encoding errors

**Expected Result**:
- Handles different encodings
- No corruption
- Parses correctly

**Status**: ⬜ Not Started

---

## Performance Tests

### Test Case PERF-1: Dashboard Refresh Rate

**Objective**: Dashboard refresh is performant

**Setup**: 10+ TODOs

**Steps**:
1. Start timer
2. Check refresh happens every 5 seconds
3. Measure responsiveness
4. Check CPU usage stays low

**Expected Result**:
- Exactly 5-second refresh
- No noticeable lag
- CPU usage < 2%

**Status**: ⬜ Not Started

---

### Test Case PERF-2: Comment Parsing Speed

**Objective**: Parsing is fast

**Setup**: 50-line file with TODOs

**Steps**:
1. Open file
2. Measure time to decorations appear
3. Time should be <100ms

**Expected Result**:
- Parsing completes < 100ms
- User sees decorations immediately
- No perceived delay

**Status**: ⬜ Not Started

---

### Test Case PERF-3: Filter Scoring Speed

**Objective**: Suggestion filtering is fast

**Setup**: 5+ suggestions to filter

**Steps**:
1. Trigger suggestion generation
2. Measure filtering time
3. Should be <50ms per suggestion

**Expected Result**:
- Filtering < 50ms per suggestion
- Scoring is instant
- No blocking UI

**Status**: ⬜ Not Started

---

### Test Case PERF-4: Memory Usage - Normal

**Objective**: Normal memory usage

**Setup**: 20+ files with TODOs

**Steps**:
1. Check memory baseline
2. Open workspace
3. Check memory after activation
4. Difference should be < 50MB

**Expected Result**:
- Baseline: normal
- After Phase 4: +< 50MB
- No memory leaks

**Status**: ⬜ Not Started

---

### Test Case PERF-5: Memory Usage - Extended Use

**Objective**: Memory stable over time

**Setup**: Phase 4 running

**Steps**:
1. Open many files
2. Create many TODOs
3. Switch files rapidly
4. Monitor memory over 30 min
5. Check stability

**Expected Result**:
- Memory usage stable
- No gradual increase
- Caching works properly
- LRU eviction prevents growth

**Status**: ⬜ Not Started

---

### Test Case PERF-6: Large File Performance

**Objective**: 1000-line file handled efficiently

**Setup**: Create 1000-line file with 50 TODOs

**Steps**:
1. Open file
2. Measure decoration time
3. Scroll through file
4. Check responsiveness

**Expected Result**:
- Decorations show < 500ms
- Scrolling smooth
- No lag while editing

**Status**: ⬜ Not Started

---

### Test Case PERF-7: Multi-Language Performance

**Objective**: Parsing multiple languages fast

**Setup**: 5 files in different languages

**Steps**:
1. Open all files
2. Measure total activation time
3. Check responsiveness

**Expected Result**:
- All files parsed efficiently
- Total time < 1 second
- Quick response

**Status**: ⬜ Not Started

---

### Test Case PERF-8: Dashboard Auto-Refresh Load

**Objective**: 5-second refresh doesn't impact UI

**Setup**: Dashboard visible

**Steps**:
1. Monitor while dashboard refreshes
2. Try typing in editor
3. Check responsiveness

**Expected Result**:
- Typing not affected by refresh
- No stuttering
- Smooth 60 FPS (if monitored)

**Status**: ⬜ Not Started

---

## Test Summary Report

After completing all tests, fill in:

### Overall Status
- **Total Tests**: 80+
- **Passed**: __/__
- **Failed**: __/__
- **Skipped**: __/__
- **Pass Rate**: __%

### By Category
| Category | Passed | Failed | Status |
|----------|--------|--------|--------|
| Dashboard | ⬜ | ⬜ | ⬜ |
| Comment Parser | ⬜ | ⬜ | ⬜ |
| Decorations | ⬜ | ⬜ | ⬜ |
| Hover | ⬜ | ⬜ | ⬜ |
| CodeLens | ⬜ | ⬜ | ⬜ |
| Filtering | ⬜ | ⬜ | ⬜ |
| Achievements | ⬜ | ⬜ | ⬜ |
| Integration | ⬜ | ⬜ | ⬜ |
| Edge Cases | ⬜ | ⬜ | ⬜ |
| Performance | ⬜ | ⬜ | ⬜ |

### Critical Issues Found
List any blocking issues:
1. ___
2. ___
3. ___

### Known Limitations
List any known issues:
1. ___
2. ___

### Recommendations
List improvements for future:
1. ___
2. ___

### Tester Sign-Off
- **Tester Name**: _____
- **Date**: _____
- **Overall Status**: ⬜ PASS ⬜ FAIL

---

*Last Updated: January 2025*  
*Document Version: 1.0*  
*Testing Difficulty: Intermediate*
