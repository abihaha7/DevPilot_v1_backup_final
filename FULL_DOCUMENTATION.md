# DevPilot - Comprehensive Documentation

## Overview

DevPilot is an AI-powered VS Code extension designed for developers of all levels. It provides intelligent code assistance, analysis, and educational features powered by both native analysis and optional LLM integration.

### Core Philosophy

- **Native-First**: Features work offline using deterministic analysis
- **Extensible**: Easy to add new languages, patterns, and analyses
- **Educational**: Built with learning and skill development in mind
- **Privacy-Conscious**: Optional LLM integration, no forced cloud dependencies

---

## Features

### 1. Real-Time Code Analysis

**Hover Explanations** - Get instant explanations of JavaScript/TypeScript keywords, built-ins, operators, and methods by hovering over them.

```typescript
// Hover over 'const' to see explanation
const name = "DevPilot";
```

**Inline Completions** - Smart code snippets that complete common patterns based on context.

```typescript
// Type 'function' and get suggestions
function myFunc() {
  // Snippet inserted here
}
```

### 2. Error Detection & Explanation

DevPilot detects code errors and provides clear explanations with suggestions.

**Detects:**
- Unused variables
- Missing return type annotations
- Empty function bodies
- Async/await issues
- Null/undefined references
- Type mismatches

```typescript
// Hover over error to see explanation and fix suggestion
const unused = 5;  // ⚠️ Detected as unused
```

### 3. AST-Based Code Analysis

Deep structural analysis of your code provides:
- Symbol extraction (functions, classes, variables, imports)
- Code metrics (complexity, depth, dependencies)
- Function signatures and type detection
- Unused code detection

### 4. Multi-Language Support

**Officially Supported:**
- JavaScript / TypeScript
- Python
- Go
- Rust
- Java
- C#
- C++
- HTML / CSS

Each language has:
- Syntax-aware analysis
- Language-specific patterns
- Comment extraction
- Structure detection

### 5. Code Refactoring

Get suggestions for:
- **Performance** improvements (memoization, Set vs Array)
- **Readability** enhancements (template literals, optional chaining)
- **Security** fixes (XSS prevention, SQL injection avoidance)
- **Maintainability** updates (magic numbers, nested ternaries)

### 6. Workspace Context Awareness

DevPilot understands your project:
- Automatic project metadata detection (package.json, pyproject.toml, go.mod)
- Dependency tracking
- File structure navigation
- Related file suggestions
- Workspace statistics

### 7. Intelligent Commit Messages

Analyzes git diffs to generate meaningful commit messages based on file changes and semantic patterns.

```bash
# From diff analysis
git commit -m "refactor: improve utils functions with better error handling"
```

### 8. Learning Chatbot

Context-aware assistant for code questions and learning.

### 9. Todo Tracker

Scans and manages TODO comments in your codebase with optional source control integration.

### 10. Quiz Runner

Educational quizzes for JavaScript, HTML, CSS at multiple difficulty levels.

---

## Installation & Setup

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "DevPilot"
4. Click Install

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/devpilot.git
cd devpilot

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
npm run watch
```

### Configuration

DevPilot works out-of-the-box, but you can configure it:

1. Open VS Code Settings
2. Search for "DevPilot"
3. Customize preferences:
   - Enable/disable hover explanations
   - Enable/disable inline completions
   - Set debounce delay
   - Configure max completion items

### Optional: OpenAI Integration

For advanced LLM features:

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run: "DevPilot: Set OpenAI API Key"
3. Paste your API key

---

## Architecture

### Core Modules

```
src/
├── core/
│   ├── extension.ts          # Entry point & activation
│   ├── logger.ts             # Structured logging
│   ├── errorHandler.ts       # Error management
│   ├── stateManager.ts       # State persistence
│   ├── astAnalysis.ts        # AST parsing & analysis
│   ├── errorDetection.ts     # Error detection engine
│   ├── multiLanguage.ts      # Multi-language support
│   ├── refactoring.ts        # Refactoring suggestions
│   ├── workspaceContext.ts   # Project awareness
│   ├── config.ts             # Feature flags
│   ├── llm.ts                # LLM integration
│   └── prompts.ts            # LLM prompts
│
├── providers/
│   ├── hover.ts              # Hover provider
│   └── inline.ts             # Inline completions
│
├── knowledge/
│   ├── heuristics.ts         # Hover knowledge base
│   └── patterns.ts           # Code patterns
│
├── services/
│   ├── commits.ts            # Commit generation
│   └── commitService.ts      # Commit integration
│
├── components/               # React UI components
├── utils/                    # Utilities
└── @types/                   # Type definitions
```

### Data Flow

```
User Action
    ↓
VS Code API
    ↓
Extension Core (extension.ts)
    ↓
Relevant Module (analysis, detection, refactoring, etc.)
    ↓
Result (Webview, Hover, Inline Suggestion, etc.)
```

### Key Technologies

- **[Babel](https://babeljs.io/)** - AST parsing for JavaScript/TypeScript
- **[@babel/traverse](https://babeljs.io/docs/babel-traverse)** - AST traversal
- **[VS Code API](https://code.visualstudio.com/api)** - Extension integration
- **[React](https://react.dev/)** - UI components
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component library
- **[Simple-git](https://github.com/steveukx/simple-git)** - Git integration

---

## Usage Guide

### Hover Explanations

Simply hover over JavaScript/TypeScript code to see explanations:

```typescript
function greet(name: string): string {  // Hover over 'function'
  return `Hello, ${name}!`;
}
```

### Inline Completions

Start typing patterns to get smart completions:

```typescript
// Type these and get suggestions:
- "function"
- "class"
- "const"
- "=>  (arrow function)"
```

### Error Analysis

DevPilot automatically highlights errors:

```typescript
const x: number = "string";  // ⚠️ Type mismatch error
```

Hover over the underlined code to see explanation and fix suggestions.

### Refactoring

1. Open Command Palette
2. Run: "DevPilot: Suggest Refactorings"
3. Review suggestions
4. Click to apply individual refactorings or bulk apply by category

### Commit Generation

1. Make code changes
2. Open Command Palette
3. Run: "DevPilot: Generate Commit Message"
4. Review and use generated message

### Todo Tracking

1. Open the "Todo Tracker" from the sidebar
2. All TODO comments in your code are listed
3. Mark items as complete/incomplete
4. Click to navigate to each TODO

### Learning Chat

1. Click "Learning Chatbot" in the sidebar
2. Ask questions about code
3. Get contextual answers and examples

---

## API Reference

### Logger

```typescript
import { getLogger } from "./core/logger";

const logger = getLogger("MyModule");
logger.info("Message", { context: "data" });
logger.warn("Warning message");
logger.error("Error message", { error });
```

### Error Handler

```typescript
import { errorHandler } from "./core/errorHandler";

try {
  // Your code
} catch (error) {
  await errorHandler.handle(error, { context: "info" });
}
```

### State Manager

```typescript
import { getStateManager } from "./core/stateManager";

const state = getStateManager();
await state.set("myKey", { data: "value" });
const data = await state.get("myKey");
```

### AST Analysis

```typescript
import { ASTAnalyzer } from "./core/astAnalysis";

const analyzer = new ASTAnalyzer();
analyzer.parse(code, "typescript");
const symbols = analyzer.getSymbols();
const issues = analyzer.analyzeForIssues();
const metrics = analyzer.calculateMetrics();
```

### Error Detection

```typescript
import { getErrorDetector } from "./core/errorDetection";

const detector = getErrorDetector();
const errors = detector.detectErrors(code, "typescript");
errors.forEach(error => {
  const explanation = detector.explainIssue(error);
  console.log(explanation.suggestion);
});
```

### Refactoring

```typescript
import { getRefactorer } from "./core/refactoring";

const refactorer = getRefactorer("typescript");
const suggestions = refactorer.getSuggestions(code);
const report = refactorer.generateReport(code);
```

### Multi-Language Support

```typescript
import { LanguageDetector, LanguageAnalyzer } from "./core/multiLanguage";

const lang = LanguageDetector.detectByExtension("myfile.py");
const analyzer = new LanguageAnalyzer(lang);
const keywords = analyzer.extractKeywords(code);
```

### Workspace Context

```typescript
import { getWorkspaceContext } from "./core/workspaceContext";

const context = getWorkspaceContext();
const metadata = await context.getProjectMetadata();
const files = await context.getSourceFiles();
const structure = await context.getDirectoryStructure();
```

---

## Configuration Options

### Feature Flags

Edit `src/core/config.ts`:

```typescript
export const defaultConfig: DevPilotConfig = {
  useNativeMode: true,              // Enable native analysis
  useLLMMode: true,                 // Enable LLM features (requires API key)
  enableHoverExplanations: true,    // Hover tooltips
  enableInlineCompletions: true,    // Code suggestions
  enableSnippetCursors: true,       // Cursor placement in snippets
  debounceDelay: 400,               // Debounce delay (ms)
  maxCompletionItems: 5,            // Max suggestions shown
};
```

### Log Configuration

DevPilot creates logs in your VS Code user directory:
- View output: Open VS Code Output panel → Select "DevPilot"
- File logs: Created in `.vscode/logs/devpilot.log`

---

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run compile
npm run package
```

### Debugging

1. Open VS Code in extension development mode
2. Press F5 to launch debug session
3. Set breakpoints in code
4. Use Debug Console for inspection

---

## Troubleshooting

### Extension not activating

**Issue**: DevPilot commands don't appear in Command Palette

**Solutions**:
1. Reload VS Code window (Cmd+R / Ctrl+R)
2. Check that file is JavaScript/TypeScript/Python/Go
3. View output panel for activation errors

### Hover explanations not working

**Issue**: No tooltip appears when hovering

**Solutions**:
1. Check "Hover explanations" is enabled in settings
2. Ensure file is JavaScript or TypeScript
3. Try hovering on keywords like `const`, `function`, `if`

### Performance issues

**Issue**: VS Code feels slow with DevPilot

**Solutions**:
1. Increase `debounceDelay` in config (default: 400ms)
2. Disable `enableInlineCompletions` if not needed
3. Check VS Code extensions list for conflicts

### API Key issues

**Issue**: "Invalid API key" message

**Solutions**:
1. Verify API key from OpenAI dashboard
2. Check key has sufficient credits
3. Run: "DevPilot: Set OpenAI API Key" again

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/MyFeature`)
3. Write tests for new features
4. Submit pull request with description

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Use descriptive variable/function names
- Add JSDoc comments for public APIs
- Run linter: `npm run lint`

### Testing

- Add tests for bug fixes
- Add tests for new features
- Ensure all tests pass: `npm test`
- Aim for >80% coverage on new code

---

## Performance Optimization

DevPilot is optimized for performance:

- **Caching**: Frequently accessed data cached in memory
- **Debouncing**: Analysis operations debounced to reduce frequency
- **Lazy Loading**: Features load only when needed
- **Incremental Analysis**: Only analyzes changed files

### Performance Tips

1. Increase debounce delay for large files
2. Disable features you don't use
3. Keep file size reasonable (<5000 lines)
4. Use `// @ts-ignore` for problematic lines

---

## FAQ

**Q: Does DevPilot require an internet connection?**  
A: No. Core features (hover, completions, error detection) work fully offline. LLM features require API key.

**Q: Can I use DevPilot in my company?**  
A: Yes. DevPilot is MIT licensed and can be used in commercial projects.

**Q: How do I report bugs?**  
A: Open an issue on GitHub with reproduction steps.

**Q: Can I contribute language support?**  
A: Absolutely! See CONTRIBUTING.md for guidelines.

---

## License

DevPilot is MIT licensed. See LICENSE file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourrepo/devpilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourrepo/devpilot/discussions)
- **Email**: support@devpilot.dev

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

---

**Last Updated**: January 31, 2026  
**Version**: 0.0.1 (Beta)
