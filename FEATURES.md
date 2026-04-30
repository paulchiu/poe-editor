# Poe Markdown Editor Features

Poe includes standard Markdown editor functionality and a set of unique features that are less common.

## Common Markdown Editor Features

- Live Markdown preview while typing.
- Split-pane editing and preview, with editor-only and preview-only modes.
- Standard formatting actions: headings, bold/italic, links, inline code, code blocks, quotes, and lists (bullet, numbered, task).
- Syntax-highlighted code blocks in preview.
- Keyboard shortcuts and in-app shortcuts help.
- Export/download as Markdown (`.md`) and HTML (`.html`).
- Dark and light theme support.
- Mobile-friendly layout.

## Notable Features

### Document and Session

| Feature                                    | Notes                                                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL-based document persistence             | Content is compressed into the URL hash; no login or backend storage required.                                                                                                      |
| Share links with readable metadata         | Shared URLs include a title/snippet path plus compressed hash payload.                                                                                                              |
| Share preview hero images                  | Social previews can use `?hero=<image-url>`; when multiple doc images exist, first is used.                                                                                         |
| Dynamic title + emoji favicon from content | First heading drives page title; supports Unicode emoji and GitHub-style shortcodes (e.g., `:smile:`) for favicon/title parsing; fallback prefers file name, then shared URL title. |
| URL length safety + testing override       | Over-limit warnings are surfaced; `?limit=<n>` can override max length for testing.                                                                                                 |
| Persisted editor preferences               | Vim mode, line numbers, word count, spell check, preview font size, and start-empty preference persist.                                                                             |
| App reset                                  | Reset app state is available (saved transformers are intentionally preserved).                                                                                                      |

### Preview and Rendering

| Feature                            | Notes                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mermaid diagram rendering          | Mermaid code blocks render as diagrams in preview.                                                                                                                                                                                                                                                                    |
| Front matter properties panel      | Top-of-file YAML front matter renders as a properties panel in preview/export while headings, TOC, title, and favicon behavior use the Markdown body. Nested object values render as readable nested key/value metadata. Top-level boolean values render as tickable checkboxes that toggle the YAML source on click. |
| Print-friendly preview/export      | Browser print renders styled, non-interactive output (black-on-white), expands toggles, and forces Mermaid diagram legibility.                                                                                                                                                                                        |
| Code fence language headers        | Fenced code blocks with a language show a header label.                                                                                                                                                                                                                                                               |
| Interactive task list checkboxes   | Markdown task items (`- [ ]` / `- [x]`) render as clickable checkboxes in preview and update source markdown state.                                                                                                                                                                                                   |
| GitHub-safe HTML tag rendering     | Preview supports a sanitized subset of common GitHub-safe HTML tags (e.g., `details`, `kbd`, tables, and images).                                                                                                                                                                                                     |
| GitHub callout rendering           | GitHub alert syntax blockquotes (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) render with `markdown-alert` styling.                                                                                                                                                                               |
| GitHub-style strikethrough         | Tilde-wrapped text (`~~text~~`) renders with strikethrough semantics across paragraphs, lists, blockquotes, and table cells.                                                                                                                                                                                          |
| GitHub-style autolink literals     | Bare URL/email literals are auto-linked in preview, excluding inline/fenced code.                                                                                                                                                                                                                                     |
| GitHub-style footnotes             | Footnote references and definitions (`[^1]`) render as superscript links with a grouped footnotes section and backreferences.                                                                                                                                                                                         |
| GitHub-style emoji shortcodes      | Emoji shortcodes like `:smile:` render as Unicode in preview; emoji support is loaded on-demand only when shortcode patterns are detected.                                                                                                                                                                            |
| Extended markdown pack             | Built-in non-GFM enhancements include `<!-- TOC -->` directive, superscript/subscript (`^...^`, `~...~`), highlight (`==...==`), and definition lists (`dl/dt/dd`); preview TOC panel visibility is configurable in settings.                                                                                         |
| Synchronized editor/preview scroll | Scroll sync uses ratio-based matching between Monaco and preview.                                                                                                                                                                                                                                                     |
| Preview jump-to-top control        | Long preview documents show a floating control after scrolling down, letting readers return to the start of the preview pane.                                                                                                                                                                                         |
| Preview font-size controls         | Interactive preview panes include floating controls to increase or decrease reading size; the setting is bounded and persists across sessions without changing print-friendly output.                                                                                                                                 |
| Preview rich-text copy             | Copy supports both HTML and plain text where browser APIs allow.                                                                                                                                                                                                                                                      |
| Preview code-block quick-copy      | Fenced code blocks in preview include one-click source copy controls; Mermaid blocks provide split actions for image copy and source copy.                                                                                                                                                                            |
| Editor markdown quick-copy         | Editor pane includes one-click Markdown copy action.                                                                                                                                                                                                                                                                  |

### Editing and Input

| Feature                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enhanced Vim mode (Monaco)              | Includes configurable logical/display movement for `j/k` and `0/^/$` via `:set displayline` (or settings toggle), explicit display-line movement on `gj/gk/g0/g^/g$`, line-relative `+/-/_` motions, markdown-aware paragraph jumps (`{`/`}`), `%` bracket/quote/fence matching, jump-list traversal (`<C-o>`/`<C-i>`), and reliable `H/M/L` high-middle-low cursor jumps (document-relative when file fits view, viewport-relative otherwise). |
| Vim viewport centering (`zz`)           | In Vim mode, `zz` centers the cursor line in the editor viewport.                                                                                                                                                                                                                                                                                                                                                                               |
| Vim spell and wrap options              | Supports Vim `:set spell` sync and `:set wrap`/`:set nowrap` behavior.                                                                                                                                                                                                                                                                                                                                                                          |
| Spell check with dictionary integration | Monaco spellcheck uses `typo-js` dictionary data.                                                                                                                                                                                                                                                                                                                                                                                               |
| Browser-aware Vim clipboard behavior    | Vim yank writes to system clipboard + register; visual-mode yank restores cursor to selection start; visual-char mode renders cursor at Vim head position; `p/P` stays register-based (due to browser limitations).                                                                                                                                                                                                                             |
| Emoji shortcode picker                  | Typing `:` in the editor opens a searchable picker near the cursor that inserts GitHub-style shortcode text (e.g., `:smile:`/`:+1:`); shortcode data is lazy-loaded on first trigger and the picker can be disabled in settings.                                                                                                                                                                                                                |
| Auto-continue lists and blockquotes     | Enter key continues or exits list/quote prefixes intelligently, including preserving task list checked state for new items.                                                                                                                                                                                                                                                                                                                     |

### Markdown Table

| Feature                         | Notes                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Markdown table editing toolkit  | Insert/delete rows and columns, plus a format-table action.                           |
| Format all tables               | Format every markdown table in the document in one action via the Table toolbar menu. |
| Table keyboard navigation       | `Tab` / `Shift+Tab` navigate table cells in-editor.                                   |
| CJK/emoji-aware table alignment | Table formatter accounts for wide character display width.                            |

### Text Transformation

Full operation details are listed in [Built-In Transformer Operations](#built-in-transformer-operations).

| Feature                               | Notes                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Transformer pipelines (27 operations) | Build reusable pipelines and apply them to selected text.                |
| Pipeline drag-and-drop reorder        | Reorder pipeline buttons in the toolbar and steps in the workbench.      |
| Transformer GUI + JSON editing modes  | Switch between visual builder and JSON mode with schema validation.      |
| Transformer config import/export      | Versioned JSON schema import/export for sharing and reuse.               |
| Transformer configuration reset       | Clear saved transformer configuration back to an empty set when needed.  |
| Transformer toolbox search/categories | Search and filter by `Text`, `Lines`, `Structure`, `Search`, and `Data`. |
| Transformer power command             | `/add-all` in toolbox search adds all available operations.              |
| Transformer JSON error feedback       | `Format JSON` surfaces invalid-input warnings in preview and on apply.   |

#### Built-In Transformer Operations

- Text: Trim Whitespace, Change Case, Indent/Dedent, Pad/Align, Slugify, Quote/Unquote, Replace Text.
- Lines: Remove Empty Lines, Sort Lines, Remove Duplicates, Reverse Lines, Number Lines, Shuffle Lines.
- Structure: Join Lines, Split Lines, Wrap Lines, Word Wrap.
- Search: Extract Matches, Keep Lines Matching, Remove Lines Matching, Remove Characters.
- Data: Encode/Decode, Format JSON (whole text or line-by-line), Strip HTML, Escape/Unescape, Format Numbers, Increment Numbers.
