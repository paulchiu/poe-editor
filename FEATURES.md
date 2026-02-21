# Poe Markdown Editor Features

Poe includes standard Markdown editor functionality and a set of unique features that are less common.

## Common Markdown Editor Features

- Live Markdown preview while typing.
- Split-pane editing and preview, with editor-only and preview-only modes.
- Standard formatting actions: headings, bold/italic, links, inline code, code blocks, quotes, and lists.
- Syntax-highlighted code blocks in preview.
- Keyboard shortcuts and in-app shortcuts help.
- Export/download as Markdown (`.md`) and HTML (`.html`).
- Dark and light theme support.
- Mobile-friendly layout.

## Notable Features

### Document and Session

| Feature                                    | Notes                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| URL-based document persistence             | Content is compressed into the URL hash; no login or backend storage required.       |
| Share links with readable metadata         | Shared URLs include a title/snippet path plus compressed hash payload.               |
| Dynamic title + emoji favicon from content | First Markdown heading drives page title; first emoji can become favicon.            |
| URL length safety + testing override       | Over-limit warnings are surfaced; `?limit=<n>` can override max length for testing.  |
| Persisted editor preferences               | Vim mode, line numbers, word count, spell check, and start-empty preference persist. |
| App reset                                  | Reset app state is available (saved transformers are intentionally preserved).       |

### Preview and Rendering

| Feature                            | Notes                                                             |
| ---------------------------------- | ----------------------------------------------------------------- |
| Mermaid diagram rendering          | Mermaid code blocks render as diagrams in preview.                |
| Theme-aware Mermaid diagrams       | Mermaid output uses separate light/dark theme tokens.             |
| Mermaid support in HTML export     | Exported HTML includes Mermaid runtime/init when diagrams exist.  |
| Synchronized editor/preview scroll | Scroll sync uses ratio-based matching between Monaco and preview. |
| Preview rich-text copy             | Copy supports both HTML and plain text where browser APIs allow.  |
| Editor markdown quick-copy         | Editor pane includes one-click Markdown copy action.              |

### Editing and Input

| Feature                                 | Notes                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Enhanced Vim mode (Monaco)              | Includes wrapped-line motions, custom bracket/quote/fence matching, and `%` jumps between opening and closing sets. |
| Browser-aware Vim clipboard behavior    | Vim yank writes to system clipboard + register; `p/P` stays register-based (due to browser limitations).            |
| Vim spell and wrap options              | Supports Vim `:set spell` sync and `:set wrap`/`:set nowrap` behavior.                                              |
| Spell check with dictionary integration | Monaco spellcheck uses `typo-js` dictionary data.                                                                   |
| Auto-continue lists and blockquotes     | Enter key continues or exits list/quote prefixes intelligently.                                                     |

### Markdown Table

| Feature                         | Notes                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| Markdown table editing toolkit  | Insert/delete rows and columns, plus a format-table action. |
| Table keyboard navigation       | `Tab` / `Shift+Tab` navigate table cells in-editor.         |
| CJK/emoji-aware table alignment | Table formatter accounts for wide character display width.  |

### Text Transformation

Full operation details are listed in [Built-In Transformer Operations](#built-in-transformer-operations).

| Feature                               | Notes                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Transformer pipelines (25 operations) | Build reusable pipelines and apply them to selected text.                |
| Pipeline drag-and-drop reorder        | Reorder pipeline buttons in the toolbar and steps in the workbench.      |
| Transformer GUI + JSON editing modes  | Switch between visual builder and JSON mode with schema validation.      |
| Transformer config import/export      | Versioned JSON schema import/export for sharing and reuse.               |
| Transformer configuration reset       | Clear saved transformer configuration back to an empty set when needed.  |
| Transformer toolbox search/categories | Search and filter by `Text`, `Lines`, `Structure`, `Search`, and `Data`. |
| Transformer power command             | `/add-all` in toolbox search adds all available operations.              |

#### Built-In Transformer Operations

- Text: Trim Whitespace, Change Case, Indent/Dedent, Pad/Align, Slugify, Quote/Unquote, Replace Text.
- Lines: Remove Empty Lines, Sort Lines, Remove Duplicates, Reverse Lines, Number Lines, Shuffle Lines.
- Structure: Join Lines, Split Lines, Wrap Lines, Word Wrap.
- Search: Extract Matches, Keep Lines Matching, Remove Lines Matching, Remove Characters.
- Data: Encode/Decode, Escape/Unescape, Format Numbers, Increment Numbers.
