# Diagnostics Range Improvement Guide

## Current State
Diagnostics currently report errors at full-line granularity (from column 0 to end).

## Proposed Improvement: Precise AST Node Ranges

### Goal
Map diagnostic errors to exact AST node positions so VS Code highlights only the problematic code.

### Implementation Strategy

#### Step 1: Extend CodeIssue Interface
```typescript
// In astAnalysis.ts
export interface CodeIssue {
  line: number;
  column: number;
  endLine?: number;      // Add these
  endColumn?: number;    // for precise ranges
  message: string;
  severity: "error" | "warning" | "info";
  code: string;
}
```

#### Step 2: Capture Node Positions During Analysis
```typescript
// In ASTAnalyzer.analyzeForIssues()
VariableDeclarator: (path) => {
  if (t.isIdentifier(path.node.id)) {
    const name = path.node.id.name;
    const usages = this.findUsages(name);
    if (usages.length <= 1) {
      this.issues.push({
        line: path.node.loc?.start.line || 0,
        column: path.node.loc?.start.column || 0,
        endLine: path.node.loc?.end.line,        // Capture end
        endColumn: path.node.loc?.end.column,    // Capture end
        message: `Variable '${name}' is declared but never used`,
        severity: "warning",
        code: "UNUSED_VAR",
      });
    }
  }
}
```

#### Step 3: Update Diagnostics Conversion
```typescript
// In extension.ts updateDiagnostics()
const diags: vscode.Diagnostic[] = (res.issues || []).map((issue: any) => {
  const start = new vscode.Position(
    Math.max(0, (issue.line || 1) - 1),
    Math.max(0, issue.column || 0)
  );
  const end = new vscode.Position(
    Math.max(0, (issue.endLine || issue.line || 1) - 1),
    Math.max(0, issue.endColumn || Number.MAX_SAFE_INTEGER)
  );
  const range = new vscode.Range(start, end);
  // ... rest of code
});
```

#### Step 4: Same for ErrorDetection
Apply similar logic to `errorDetection.ts` so detected errors also have precise ranges.

### Expected Outcome
- Diagnostics highlight only the variable/token, not the full line
- Cleaner, more precise feedback to developers
- Better visual distinction between multiple issues on same line

### Effort: ~1-2 hours
### Risk: Low (additive, backward-compatible)

---

## Example Before/After

### Before
```typescript
let unused = 5;  // ← Full line highlighted in red
```

### After
```typescript
let unused = 5;  // ← Only 'unused' highlighted
    ^^^^^^^^
```
