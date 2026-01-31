# Step Config Component Specification

This document defines the patterns and requirements for creating step configuration components in the formatter pipeline.

## Purpose

Step config components provide operation-specific UI controls for configuring pipeline steps. They are rendered inside `PipelineStepCard` when a user adds or modifies a formatter operation.

---

## Interface Contract

All config components must follow this interface pattern:

```typescript
interface [OperationName]ConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  operationId?: string  // Optional: only if behavior varies by operation
}

export function [OperationName]Config({ config, onChange }: [OperationName]ConfigProps): ReactElement | null
```

### Key Requirements

1. **Accept `config` object** – Current configuration values
2. **Call `onChange` with spread** – Always preserve existing config: `onChange({ ...config, key: value })`
3. **Return `ReactElement | null`** – Return `null` if no UI is needed

---

## Styling Conventions

### Container

```tsx
<div className="mt-3 animate-in slide-in-from-top-2 duration-200">
```

- `mt-3` separates from card header
- Entry animation for smooth reveal

### Labels

```tsx
<label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
```

### Input Fields

Use `@/components/ui/input` component:

```tsx
<Input
  value={(config.fieldName as string) || ''}
  onChange={(e) => onChange({ ...config, fieldName: e.target.value })}
  placeholder="Description..."
  className="h-8 text-xs bg-muted/20"
/>
```

- Height: `h-8` (standalone inputs)
- Text size: `text-xs`
- Background: `bg-muted/20`
- Optional: `font-mono` for technical inputs

#### Height Alignment with Toggle Buttons

When an input field appears **next to** toggle button groups in a grid layout (e.g., `grid-cols-2`), use `h-[38px]` to match the toggle button group height:

```tsx
<div className="grid grid-cols-2 gap-2">
  <div className="space-y-1">
    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
      Mode
    </label>
    <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-md border text-[10px]">
      {/* Toggle buttons with py-1.5 */}
    </div>
  </div>
  <div className="space-y-1">
    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
      Value
    </label>
    <Input
      className="h-[38px] text-xs bg-muted/20"  {/* Matches toggle height */}
    />
  </div>
</div>
```

**Why 38px?** Toggle button groups have:

- Container: `p-1` (8px total padding)
- Buttons: `py-1.5` (12px total padding)
- Border: 2px
- Total: ~38px

Use `h-[38px]` for inputs in the same row as toggle buttons to ensure visual alignment.

### Checkbox Options

```tsx
<label className="flex items-center gap-2 px-2 h-7 border rounded-md bg-muted/20 text-xs cursor-pointer hover:border-primary/50 transition-colors">
  <input
    type="checkbox"
    checked={!!config.option}
    onChange={(e) => onChange({ ...config, option: e.target.checked })}
    className="rounded border-input text-primary focus:ring-primary h-3 w-3"
  />
  Option Label
</label>
```

### Toggle Button Groups

For mutually exclusive options:

```tsx
<div className="grid grid-cols-N gap-1 bg-muted/20 p-1 rounded-md border text-xs">
  {options.map((opt) => (
    <button
      key={opt.id}
      className={cn(
        'py-1.5 px-2 rounded-sm transition-colors text-center',
        config.field === opt.id
          ? 'bg-background shadow-sm text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
      onClick={() => onChange({ ...config, field: opt.id })}
      title={`Tooltip: ${opt.label}`}
    >
      {opt.label}
    </button>
  ))}
</div>
```

---

## Patterns by Complexity

### Minimal Config (No UI)

When an operation has no configurable options:

```tsx
// TrimConfig.tsx
export function TrimConfig(_props: TrimConfigProps): ReactElement | null {
  return null
}
```

### Single Control

Wrap in container with label:

```tsx
// FilterLinesConfig.tsx
<div className="mt-3 animate-in slide-in-from-top-2 duration-200">
  <label className="flex items-center gap-2 ...">
    <input type="checkbox" ... />
    Description
  </label>
</div>
```

### Multi-Field Layout

Use grid for related fields:

```tsx
// ReplaceConfig.tsx
<div className="grid gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
  <div className="grid grid-cols-2 gap-2">
    {/* Field 1 */}
    {/* Field 2 */}
  </div>
  <div className="flex gap-2">{/* Checkbox options */}</div>
</div>
```

### Adaptive Behavior

Pass `operationId` when one component serves multiple operations:

```tsx
// JoinSplitLinesConfig.tsx
export function JoinSplitLinesConfig({ config, onChange, operationId }: Props) {
  const placeholder = operationId === 'join-lines' ? 'Space, comma...' : 'Separator'
  // ...
}
```

---

## Integration Checklist

When creating a new step config:

1. [ ] Create file: `[OperationName]Config.tsx`
2. [ ] Export named function matching filename
3. [ ] Add import in `PipelineStepCard.tsx`
4. [ ] Add case in `renderConfig()` switch statement
5. [ ] Define `defaultConfig` in `constants.ts` OPERATIONS entry
6. [ ] Create corresponding test file `[OperationName]Config.test.tsx`

---

## Testing Requirements

Tests should verify:

- All options render correctly
- Selected state is visually distinguished
- `onChange` is called with correct merged config
- Existing config values are preserved on change

Example structure:

```typescript
describe('[OperationName]Config', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('should render all options', () => { ... })
  it('should highlight selected option', () => { ... })
  it('should call onChange with correct value', async () => { ... })
  it('should preserve existing config values', async () => { ... })
})
```

---

## Don'ts

- ❌ Mutate `config` directly
- ❌ Use inline styles
- ❌ Create custom input components (use `@/components/ui/input`)
- ❌ Hardcode values that should come from `defaultConfig`
- ❌ Forget the entry animation class
