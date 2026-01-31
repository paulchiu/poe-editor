# Ideas for Poe Editor

## Formatter Building Blocks

### Line Operations
- **Remove Duplicate Lines** – Deduplicate lines (with option to keep first/last occurrence, case-sensitive toggle)
- **Reverse Lines** – Flip line order
- **Number Lines** – Add line numbers (configurable prefix/separator, starting number)
- **Shuffle Lines** – Randomize line order

### Text Wrapping & Formatting
- **Wrap Lines** – Add prefix and/or suffix to each line (great for list formatting, quoting)
- **Word Wrap** – Break long lines at specified column width
- **Indent/Dedent** – Add or remove leading whitespace (configurable spaces/tabs)

### Extraction & Filtering
- **Extract Matches** – Extract all regex matches (rather than replace), outputting matches only (e.g., extract all URLs, emails, numbers)
- **Keep Lines Matching** – Filter to only keep lines that match a pattern (inverse of filter empty)
- **Remove Lines Matching** – Remove lines matching a pattern

### Character Operations
- **Remove Characters** – Strip specific characters (e.g., remove all digits, punctuation, non-ASCII)
- **Encode/Decode** – URL encode/decode, Base64 encode/decode, HTML entity encode/decode
- **Escape/Unescape** – JSON escape, regex escape, etc.

### Numeric/Data Operations
- **Pad/Align** – Pad strings to fixed width (left, right, center)
- **Format Numbers** – Add thousands separators, decimal formatting
- **Increment/Decrement Numbers** – Find all numbers and +/- by value

### Markdown/Code Specific
- **Slugify** – Convert text to URL-friendly slugs
- **Quote/Unquote** – Wrap text in quotes or remove surrounding quotes
