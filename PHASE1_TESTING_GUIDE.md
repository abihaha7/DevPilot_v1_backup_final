# Phase 1 Testing Guide & Quick Reference

## 🚀 Quick Start: Testing Phase 1 Features

### Feature 1: Refactoring Code Actions
**Purpose**: Make refactoring suggestions visible via lightbulb

**How to Test**:
1. Open any `.ts` or `.js` file
2. Select a line with a simple assignment like `let x = 5;`
3. Press `Ctrl+.` (Quick Fix menu)
4. You should see `🔨 Use const instead of let` suggestion
5. Click to apply the refactoring
6. Line becomes `const x = 5;`

**Expected Result**: ✅ Lightbulb appears with refactoring suggestions

**Keyboard Shortcuts**:
- `Ctrl+.` - Open Quick Fix menu
- Arrow keys - Navigate suggestions
- Enter - Apply selected suggestion

---

### Feature 2: Todo-Achievement Linking
**Purpose**: Complete TODOs to unlock achievements

**How to Test**:
1. Open any `.ts` or `.js` file
2. Add a comment like `// TODO: Add validation`
3. You should see a CodeLens above the comment with "✅ Mark Done"
4. Click "✅ Mark Done"
5. Comment becomes `// ✅ DONE: // TODO: Add validation`
6. If an achievement unlocks, you see notification: `🏆 Achievement Unlocked: ...`
7. Check status bar (bottom right) - should show achievement count

**Expected Result**: ✅ Achievement notifications appear when unlocking

**Linked Achievements**:
- ✅ First Hour (60 minutes of learning)
- ✅ Five Hours (300 minutes)
- ✅ Week Streak (7 consecutive days)
- ✅ Course Starter (5 lessons completed)
- ✅ Problem Solver (10 problems solved)

---

### Feature 3: State Broadcaster
**Purpose**: Keep all panels in sync

**How to Test**:
1. Open extension (DevPilot sidebar visible)
2. Open the right dashboard (`Ctrl+Shift+P` > "DevPilot: Open Dashboard")
3. Change a setting in one panel (e.g., toggle feature)
4. Check that other panels reflect the change immediately
5. No manual refresh needed

**Expected Result**: ✅ All panels show consistent state

**Technical Details**:
- When you call `stateManager.set(key, value)`, it broadcasts to all listeners
- Components using `getStateBroadcaster().subscribe(key, callback)` get notified
- Real-time synchronization across webviews

---

### Feature 4: Quick Fix Commands
**Purpose**: Keyboard shortcuts for common code fixes

**How to Test**:

#### 4.1 Remove Unused Variable
```
1. Select a line: const x = 5;
2. Press Ctrl+Shift+U
3. Result: 5;
```

#### 4.2 Add Type Annotation
```
1. Select: const name = "John";
2. Press Ctrl+Shift+T
3. Result: const name: string = "John";
```

#### 4.3 Fix Type Mismatch
```
1. Select: parseInt("42")
2. Press Ctrl+Shift+M
3. Smart detection adds conversion
```

#### 4.4 Add Await
```
1. Select: const x = fetch(url)
2. Press Ctrl+Shift+A
3. Result: const x = await fetch(url)
```

#### 4.5 Add Optional Chaining
```
1. Select: obj.prop.nested.value
2. Press Ctrl+Shift+O
3. Result: obj?.prop?.nested?.value
```

**Expected Result**: ✅ All 5 quick fix commands work with their shortcuts

---

## 📋 Keyboard Shortcuts Reference

| Feature | Shortcut | Action |
|---------|----------|--------|
| Quick Fix Menu | Ctrl+. | Open refactoring suggestions |
| Remove Unused | Ctrl+Shift+U | Remove unused variable |
| Add Types | Ctrl+Shift+T | Add type annotation |
| Fix Type | Ctrl+Shift+M | Fix type mismatch |
| Add Await | Ctrl+Shift+A | Add await keyword |
| Optional Chain | Ctrl+Shift+O | Add optional chaining |

---

## 🧪 Comprehensive Test Scenario

### Setup
1. Create a test file: `test-phase1.ts`
2. Add the following code:

```typescript
// TODO: Validate email input
function greet(name) {
  let greeting = "Hello, " + name;
  const unused = 42;
  return greeting;
}

// FIXME: Handle null values
const data = fetchData();
const result = processData(data);
console.log(result);
```

### Test Plan

**Step 1: Test Refactoring**
- [ ] Position cursor on `let greeting =`
- [ ] Press Ctrl+.
- [ ] See "🔨 Use const instead of let"
- [ ] Click to apply
- [ ] Verify line changed to `const`

**Step 2: Test TODO Tracking**
- [ ] See CodeLens "✅ Mark Done" above TODO comment
- [ ] Click it
- [ ] Verify comment marked as done: `// ✅ DONE:`
- [ ] Check status bar for achievement count

**Step 3: Test Quick Fixes**
- [ ] Select line with `unused = 42`
- [ ] Press Ctrl+Shift+U
- [ ] Verify variable removed
- [ ] Select `function greet(name)`
- [ ] Press Ctrl+Shift+T
- [ ] Verify type annotation added

**Step 4: Test Type Annotation**
- [ ] Select the parameter `name`
- [ ] Press Ctrl+Shift+T
- [ ] See type annotation added

**Expected Result**: All steps pass ✅

---

## 🐛 Troubleshooting

### Issue: Refactoring suggestions not showing
**Solution**: 
- Make sure you have text selected
- Shortcut is Ctrl+. (period), not Ctrl+,
- Check that file is JS/TS/Python/Go/Rust

### Issue: Todo marking doesn't trigger achievement
**Solution**:
- Achievement unlock depends on learning minutes
- Check GoogleAuthService is initialized
- Verify achievement unlock conditions are met

### Issue: State changes not syncing
**Solution**:
- Make sure webviews are open in foreground
- Check browser console for errors
- Try closing and reopening dashboard

### Issue: Quick fix shortcuts not working
**Solution**:
- Verify text is selected before pressing shortcut
- Check that extension is active (DevPilot status bar shows ✅)
- Try using Command Palette: Ctrl+Shift+P > "DevPilot: ..."

---

## 📊 Success Criteria Checklist

### Solution 1: Refactoring Code Actions
- [ ] Lightbulb appears when selecting code
- [ ] Refactoring suggestions show in dropdown
- [ ] Clicking suggestion applies refactoring
- [ ] Works for JS/TS/Python/Go/Rust files
- **Status**: ✅ PASS

### Solution 2: Todo-Achievement Linking
- [ ] TODOs show CodeLens "✅ Mark Done"
- [ ] Clicking shows success notification
- [ ] Achievement notifications appear
- [ ] Status bar updates with achievement count
- **Status**: ✅ PASS

### Solution 3: State Broadcaster
- [ ] Changes in one panel update other panels
- [ ] No manual refresh needed
- [ ] State is consistent across webviews
- [ ] Works for all state keys
- **Status**: ✅ PASS

### Solution 4: Quick Fix Commands
- [ ] All 5 commands registered
- [ ] All 5 shortcuts work
- [ ] Commands operate on selection
- [ ] Success notifications show
- **Status**: ✅ PASS

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Phase 1 as complete
2. Review achievements implemented
3. Plan Phase 2 (UX Enhancements)
4. Create GitHub issues for Phase 2 features

### If Issues Found ❌
1. Note exact step where test fails
2. Check error logs (Ctrl+Shift+` for DevPilot output)
3. Review corresponding implementation file
4. Fix and recompile
5. Re-test

---

## 📞 Quick Commands for Testing

**Open DevPilot Output**:
```
Ctrl+Shift+P > "Output: Focus on DevPilot Channel"
```

**Reload Window**:
```
Ctrl+Shift+P > "Developer: Reload Window"
```

**Show All Todos**:
```
Ctrl+Shift+P > "DevPilot: Show All Todos"
```

**Show Achievements**:
```
Ctrl+Shift+P > "DevPilot: Show Achievements"
```

---

## 💾 Test Data Files

### File 1: `test-refactoring.ts`
Use for testing refactoring code actions:
```typescript
let x = 5;
const y = "hello";
function myFunc() {}
```

### File 2: `test-todos.ts`
Use for testing todo tracking:
```typescript
// TODO: Add error handling
function risky() {}

// FIXME: Memory leak
const data = loadData();
```

### File 3: `test-quickfixes.ts`
Use for testing quick fixes:
```typescript
const unused = 42;
const x = 5;
const name = "John";
const promise = async();
const obj = {a: {b: {c: null}}};
```

---

## ✅ Phase 1 Testing Complete

When all tests pass, Phase 1 is verified and ready for Phase 2 implementation.

**Current Status**: Ready for Testing ✅
