# 🎯 DevPilot UI Quick Reference

## Three-Surface Architecture at a Glance

```
SIDEBAR                EDITOR               SIDE PANEL
┌─────────────┐       ┌──────────────┐      ┌─────────────┐
│             │       │              │      │             │
│  DEVPILOT   │       │   CODE       │      │  COMMIT GEN │
│  MENU       │       │   FILES      │      │  CHATBOT    │
│  ────────   │       │              │      │  TODOS      │
│ • Commit    │       │  ┌────────┐  │      │  QUIZZES    │
│ • Chat      │       │  │INLINE  │  │      │  HELP       │
│ • Todos     │       │  │HINTS   │  │      │  ────────   │
│ • Quizzes   │       │  └────────┘  │      │  (ONE AT    │
│ • Help      │       │              │      │   A TIME)   │
│  ────────   │       │              │      │             │
│  Progress   │       │              │      │             │
│  Activity   │       │              │      │             │
│             │       │              │      │             │
└─────────────┘       └──────────────┘      └─────────────┘
    LEFT                 CENTER               RIGHT
  Navigate           Code Editor          Execute Feature
```

---

## Left Sidebar (Navigation Hub)

**File**: `src/components/figma-ui/dashboard/FigmaDashboard.tsx`

**Responsibility**: 
- Show available features
- Display learning progress
- Route user to features

**Components**:
- Feature menu with icons
- Learning progress bar (8/20 lessons)
- Recent activity (HTML Basics, CSS Flexbox)
- Feedback buttons (👍👎)

**User Action**:
```
User clicks "Commit Generator"
    ↓
postMessage({ type: "command", command: "devpilot.setActiveFeature", args: [{ feature: "commit" }] })
    ↓
Extension broadcasts switchFeature message
    ↓
RIGHT panel updates to show Commit Generator
```

---

## Right Panel (Feature Execution)

**File**: `src/components/figma-ui/dashboard/RightDashboard.tsx`

**Responsibility**:
- Execute selected feature
- Handle user interactions
- Show only ONE feature at a time

**Features Available**:
1. **Commit Generator** (CommitGenerator.tsx)
   - Analyzes file
   - Suggests commit message
   - Let user edit/accept

2. **Learning Chatbot** (LearningChatbot.tsx)
   - Answer code questions
   - Explain concepts
   - Multi-turn conversation

3. **Todo Tracker** (TodoTracker.tsx)
   - Create/edit tasks
   - Track learning progress
   - Mark items complete

4. **Quiz Runner** (QuizRunner.tsx)
   - HTML, CSS, JS quizzes
   - Easy, Medium, Hard levels
   - Track score

5. **Help Panel** (HelpPanel.tsx)
   - Feature guide
   - Keyboard shortcuts
   - Support links

**Feature Switching**:
```
Message received: { type: "switchFeature", payload: { feature: "commit" } }
    ↓
State updates: activeFeature = "commit"
    ↓
Conditional rendering:
  if (activeFeature === "commit") ⟹ show CommitGenerator
  if (activeFeature === "chat")   ⟹ show LearningChatbot
  if (activeFeature === "todo")   ⟹ show TodoTracker
  etc.
    ↓
Component renders with props
```

---

## Inline Overlay (Lightweight Assistance)

**File**: `src/components/figma-ui/dashboard/EditorOverlay.tsx`

**Responsibility**:
- Show hints & suggestions
- Display editor context
- Never interrupt code editing

**Displays**:
- Active file name & path
- Cursor position
- Current selections
- File changes
- Related TODOs
- Commit suggestions

**Example Flow**:
```
User hovers over code token
    ↓
Extension sends hover explanation
    ↓
EditorOverlay shows tooltip
    ↓
User can click to learn more
    ↓
No editor disruption
```

---

## Message Flow Diagram

```
LEFT PANEL                  EXTENSION CORE            RIGHT PANEL
┌──────────────┐           ┌───────────────┐         ┌──────────────┐
│ User clicks  │ ────┐     │               │         │              │
│ "Commit"     │     ├────→│ Message Queue │ ───────→│ Switch to    │
│              │     │     │ & Router      │         │ Commit Gen   │
└──────────────┘     │     │               │         └──────────────┘
                     │     └───────────────┘
                     │            │
                     │            ├────→ Sidebar (sync state)
                     │            ├────→ EditorOverlay (send context)
                     │            └────→ Status bar (show feature)
                     │
          postMessage({
            type: "command",
            command: "devpilot.setActiveFeature",
            args: [{ feature: "commit" }]
          })
```

---

## State Management

### Global State (Persisted)
```
globalState = {
  "devpilot.activeFeature": "commit" | "chat" | "todo" | "quiz-html-easy" | "help"
}
```

### Local State (Component)
```
RightDashboard:
  - activeFeature: current feature to render
  - themeKind: VS Code theme (1=light, 2=dark, 3=high-contrast)
  - chatReply: latest message from chatbot
  - quizPath: current quiz (topic, level)
```

---

## Console Output Patterns

**On Activation**:
```
[DevPilot] ✅ Providers created:
[DevPilot]   - Sidebar (LEFT panel): Navigation hub
[DevPilot]   - RightDashboard (RIGHT panel): Feature execution
[DevPilot]   - EditorOverlay (INLINE): Lightweight assistance

[DevPilot] ✅ Extension activated - all three surfaces ready

[DevPilot] 🎯 Initializing UI surfaces...
[DevPilot] ✅ Activity bar revealed
[DevPilot] ✅ LEFT panel (Sidebar) opened - Navigation hub active
[DevPilot] ✅ INLINE overlay (EditorOverlay) opened - Ready for suggestions
[DevPilot] ✅ RIGHT panel (RightDashboard) opened - Feature execution ready
[DevPilot] 📍 Initializing with 'Help' feature
[DevPilot] ✅ Help feature sent to RIGHT panel
[DevPilot] 🚀 DevPilot UI Architecture Active:
[DevPilot]    Navigation (LEFT)  →  Execution (RIGHT)  ←  Suggestions (INLINE)
```

**On Feature Switch**:
```
[DevPilot] 🔄 Feature switched → "commit" (RIGHT panel updated)
[DevPilot] 🔄 Feature switched → "chat" (RIGHT panel updated)
```

---

## File Structure

```
src/
├── core/
│   └── extension.ts          ← Extension entry point & broadcast hub
├── SidebarViewProvider.ts    ← LEFT panel lifecycle
├── RightDashboardProvider.ts ← RIGHT panel lifecycle
├── EditorOverlayProvider.ts  ← INLINE overlay lifecycle
└── components/figma-ui/dashboard/
    ├── FigmaDashboard.tsx    ← LEFT panel content
    ├── RightDashboard.tsx    ← RIGHT panel content
    ├── EditorOverlay.tsx     ← INLINE overlay content
    ├── rightDashboard.entry.tsx ← RIGHT panel entry point
    ├── features/
    │   ├── CommitGenerator.tsx
    │   ├── LearningChatbot.tsx
    │   ├── TodoTracker.tsx
    │   ├── QuizRunner.tsx
    │   └── HelpPanel.tsx
    └── ui/                   ← Radix UI components
        ├── button.tsx
        ├── dialog.tsx
        ├── input.tsx
        └── ... (30+ UI components)
```

---

## Key Design Principles

✅ **Separation of Concerns**
- LEFT shows menu → RIGHT executes → INLINE assists
- Each surface has one responsibility

✅ **Single Execution**
- Only ONE feature visible in RIGHT panel at a time
- Prevents confusion and cognitive load

✅ **Native Integration**
- Uses VS Code sidebar for navigation
- Uses side panel for features
- Uses inline overlay for hints

✅ **Non-Blocking**
- EditorOverlay never covers code
- Suggestions appear on demand
- Can dismiss easily

✅ **Consistent State**
- Extension is single source of truth
- All surfaces stay in sync
- Global state persisted

---

## Developer Quick Reference

### To Add a New Feature

1. Create component in `src/components/figma-ui/features/`
2. Export as lazy: `export default MyFeature`
3. Add to RightDashboard.tsx:
   ```tsx
   const MyFeature = React.lazy(() => import("../features/MyFeature.js"));
   
   // In render:
   {activeFeature === "myfeature" && (
     <MyFeature onClose={closeFeature} themeKind={themeKind} />
   )}
   ```
4. Add menu item in FigmaDashboard.tsx
5. Handle in RightDashboardProvider if needed

### To Add Inline Assistance

1. In EditorOverlay.tsx, request data: `postToExtension("requestXyz")`
2. In extension.ts, handle: `case "requestXyz": { ... }`
3. Send back data: `broadcast({ type: "xyz", payload: { ... } })`
4. In EditorOverlay.tsx, receive: `onExtensionMessage("xyz", ...)`
5. Render in overlay

### To Sync with Sidebar

The `broadcast()` function in extension.ts automatically sends to LEFT panel.
It will receive state updates for `switchFeature` and `theme` messages.

---

## Common Tasks

**Change Initial Feature**
```typescript
// In extension.ts, activation block:
if (!activeFeature) {
  activeFeature = "help"; // Change to "chat", "commit", etc.
  // ...
}
```

**Add New Theme Support**
```typescript
// In RightDashboard.tsx/EditorOverlay.tsx:
useEffect(() => {
  const offTheme = onExtensionMessage("theme", (payload) => {
    setThemeKind(payload?.kind);
    // Apply theme to components
  });
  return () => offTheme?.();
}, []);
```

**Debug Message Flow**
1. Check extension console for "[DevPilot]" logs
2. Look for "🔄 Feature switched →" messages
3. Check webview dev console for errors
4. Verify global state: `context.globalState.get("devpilot.activeFeature")`

---

## Status & Health Check

✅ **All Systems Operational**

- LEFT panel → shows features, learning progress, activity
- RIGHT panel → executes selected feature with React rendering
- INLINE overlay → ready to show hints and context
- Message flow → working end-to-end
- State management → persisting correctly
- Bundle loading → no module errors
- React rendering → components mounting properly

🚀 **Ready for Production**
