# OG Generator

This package generates static Open Graph images for the Poe Editor.

## Usage

From the repository root:

```bash
npm run generate:og
```

Or from this package directory:

```bash
npm run generate
```

This will create `og-home.png` in `packages/app/public`.

## Resources

- **Fonts**: Local font files are located in `./fonts`.
- **Assets**: Image assets (like the splash overlay) are in `./assets`.

## Development

The generation logic is in `src/generate.tsx` and the entry point is `src/index.tsx`.
