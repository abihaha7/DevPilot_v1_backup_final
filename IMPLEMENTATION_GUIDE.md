# DevPilot Refactoring: Implementation Guide

## Getting Started with the New Architecture

### 1. Quick Start

The refactored extension is production-ready. To use it:

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Run in development
npm run watch
```

### 2. File Mappings: Old → New

| Feature | Old File | New File(s) |
|---------|----------|------------|
| Hover explanations | hover.ts | learningHover.ts |
| Inline completions | inline.ts | (unchanged) |
| TODO management | N/A | todoTracker.ts |
| Commit generation | extension.ts | commitGenerator.ts |
| Learning dashboard | FigmaDashboard.tsx | learningTreeView.ts |
| Navigation UI | SidebarViewProvider.ts | minimalSidebar.ts |
| Authentication | N/A | authService.ts |
| AI provider | llm.ts | aiProvider.ts + openaiProvider.ts |

### 3. Key Architectural Decisions

#### Decision 1: No Heavy Webviews
✅ **Chosen**: Native VS Code APIs (Hover, CodeLens, TreeView)
- Instant response time
- No iframe overhead
- Better accessibility
- Works offline

#### Decision 2: Abstract AI Provider
✅ **Chosen**: Interface-based AI (`IAIProvider`)
- Swappable implementations
- Testable in isolation
- No webview coupling
- Future-proof

#### Decision 3: Editor-First Features
✅ **Chosen**: Minimize webviews to navigation only
- Sidebar = intent router (minimal HTML)
- All logic = editor-integrated
- Results = native UI (CodeLens, diagnostics, etc.)

### 4. Core Interfaces

#### AI Provider Interface

```typescript
interface IAIProvider {
  readonly type: AIProviderType;
  readonly isAvailable: boolean;

  // Learning-focused explanations
  getExplanation(options: AIExplanationOptions): Promise<string | null>;

  // Code completion (with reasoning)
  getCompletion(options: AICompletionOptions): Promise<AIResult | null>;

  // Refactoring with explanation
  getRefactoringSuggestions(options: AIRefactoringOptions): Promise<AIResult | null>;

  // Commit messages
  generateCommitMessage(options: AICommitOptions): Promise<string | null>;
  generateQuickCommit(options: AICommitOptions): Promise<string | null>;

  isReady(): boolean;
}
```

#### Usage Example

```typescript
import { getAIProvider } from "./core/aiProvider";

const ai = getAIProvider();
if (ai.isAvailable) {
  const explanation = await ai.getExplanation({
    code: "const x = 5;",
    language: "typescript",
    type: "what"
  });
  console.log(explanation); // "const: Creates an immutable variable..."
}
```

### 5. Adding a New Feature

Example: Add "Performance Tips" feature

**Step 1**: Create native provider file

```typescript
// src/providers/performanceTips.ts
import * as vscode from "vscode";

export class PerformanceTipsProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    // Analyze code, find performance issues
    // Return CodeLens with quick fixes
  }
}

export function registerPerformanceTips(context: vscode.ExtensionContext) {
  const provider = new PerformanceTipsProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", language: "typescript" },
      provider
    )
  );
}
```

**Step 2**: Register in extension.ts

```typescript
// In extension function
try {
  registerPerformanceTips(context);
  logger.info("Performance tips registered");
} catch (error) {
  logger.warn("Failed to register performance tips", { error: String(error) });
}
```

**Step 3**: Add command (if needed)

```typescript
register("devpilot.explainPerformanceTip", async (tip: string) => {
  const ai = getAIProvider();
  if (ai.isAvailable) {
    const explanation = await ai.getExplanation({
      code: tip,
      language: "typescript",
      type: "why"
    });
    vscode.window.showInformationMessage(explanation || "No explanation available");
  }
});
```

### 6. Testing New Features

```typescript
// src/test/newFeature.test.ts
import * as vscode from "vscode";
import { PerformanceTipsProvider } from "../providers/performanceTips";

describe("Performance Tips", () => {
  it("should detect slow loops", async () => {
    const code = `
      for (let i = 0; i < array.length; i++) {
        // O(n²) operation
      }
    `;
    const doc = await vscode.workspace.openTextDocument({
      language: "typescript",
      content: code
    });
    
    const provider = new PerformanceTipsProvider();
    const lenses = provider.provideCodeLenses(doc);
    
    expect(lenses.length).toBeGreaterThan(0);
    expect(lenses[0].command?.title).toContain("Performance");
  });
});
```

### 7. Working with AI Provider

#### Using the Active Provider

```typescript
import { getAIProvider } from "./core/aiProvider";

// Get the active provider (might be offline mode)
const provider = getAIProvider();

// Check if AI is available
if (provider.isAvailable) {
  // Safe to use AI features
  const result = await provider.getCompletion({
    prompt: "function add(a, b)",
    language: "typescript"
  });
} else {
  // Fall back to native analysis or offline mode
  const nativeResult = getNativeCompletion(...);
}
```

#### Setting a Different Provider

```typescript
import { OpenAIProvider } from "./core/openaiProvider";
import { setAIProvider } from "./core/aiProvider";

const apiKey = "sk-...";
const openai = new OpenAIProvider(apiKey);

if (openai.isReady()) {
  setAIProvider(openai);
  // Now all AI calls use OpenAI
}
```

#### Creating a Custom Provider

```typescript
import { IAIProvider, AICompletionOptions, AIResult } from "./core/aiProvider";

export class CustomAIProvider implements IAIProvider {
  readonly type = "custom";
  readonly isAvailable = true;

  isReady(): boolean { return true; }

  async getCompletion(options: AICompletionOptions): Promise<AIResult | null> {
    // Your implementation
    return { text: "...", confidence: 0.9 };
  }

  // Implement other methods...
}
```

### 8. Authentication & Progress Tracking

```typescript
import { GoogleAuthService } from "./core/authService";

const auth = new GoogleAuthService(context);

// Sign in
const profile = await auth.signInWithGoogle();

// Track activity
await auth.trackActivity("learning", 30); // 30 minutes

// Record lesson
await auth.recordLessonCompletion("js-variables");

// Get progress
const progress = auth.getProgress();
console.log(progress.currentStreak); // Current streak in days
console.log(progress.totalMinutes); // Total learning time

// Get achievements
const badges = auth.getAchievements();
// ["first_hour", "week_streak", "5_lessons"]
```

### 9. Debugging Tips

#### Enable Debug Logging

```typescript
import { getLogger } from "./core/logger";

const logger = getLogger("MyFeature");

logger.info("Feature started", { option1: "value" });
logger.warn("Unexpected behavior", { error: String(error) });
logger.error("Fatal error", { stack: error.stack });
```

#### Check Extension Logs

```
View → Output → "DevPilot" channel
```

#### Test AI Provider

```typescript
// Command: DevPilot: Test AI Provider
vscode.commands.registerCommand("devpilot.testAI", async () => {
  const ai = getAIProvider();
  
  if (!ai.isAvailable) {
    vscode.window.showInformationMessage("AI provider not available (offline mode)");
    return;
  }

  const result = await ai.getExplanation({
    code: "const x = 5;",
    language: "javascript",
    type: "what"
  });

  vscode.window.showInformationMessage(result || "No response");
});
```

### 10. Performance Guidelines

✅ **DO**:
- Use native providers for instant feedback
- Cache expensive computations
- Debounce file change events
- Return early on cancellation tokens

❌ **DON'T**:
- Call AI on every keystroke
- Block the UI thread
- Create new webviews unnecessarily
- Ignore user's offline status

### 11. Marketplace Requirements

Before publishing:

- [ ] No CommonJS/ESM hacks in any file
- [ ] Minimal CSP complexity
- [ ] Works offline (gracefully degrades)
- [ ] Fast startup (<300ms)
- [ ] Proper error handling
- [ ] Logging enabled
- [ ] Security review complete
- [ ] Accessibility verified

### 12. Future Enhancements

Ready to add:

- **CodeT5 Model**: For offline completions
- **Llama Integration**: Self-hosted AI
- **Firebase Sync**: Cloud progress storage
- **Team Features**: Shared achievements
- **Advanced Analytics**: Build speed optimization
- **Video Tutorials**: Embedded learning
- **Spaced Repetition**: SRS for learning

---

## Support & Questions

For questions about the refactoring:

1. Check `REFACTORING_COMPLETE.md` for architecture overview
2. Review example providers in `src/providers/`
3. See test files in `src/test/`
4. Check extension.ts for integration patterns

Good luck with the refactoring! 🚀
