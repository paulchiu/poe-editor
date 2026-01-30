# Poe Markdown Editor

A modern, persistent Markdown editor with Vim keybinding support.

## Inspiration

This project draws inspiration from [dillinger.io](https://dillinger.io) and the [TypeScript Playground](https://www.typescriptlang.org/play).

## Features

- **Vim Mode**: Full Vim keybinding support via Monaco Editor.
- **Live Preview**: Real-time rendering with split-pane layout.
- **State Persistence**: Content automatically saved to URL for easy sharing.
- **Theme Support**: Built-in dark and light modes.
- **Export**: Options to export content as Markdown or HTML.

## Built With

- **Core**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Editor**: Monaco Editor (with `monaco-vim`)
- **Deployment**: Cloudflare Workers

## Development

### Local Server

```bash
npm dev
```

### Worker Preview

Preview application behaviour in the Workers environment:

```bash
npm preview:worker
```

## Testing

```bash
npm test        # Unit tests
npm test:e2e    # End-to-end tests
npm lint        # Linting
```

## Deployment

### Cloudflare Workers

Configured as a Single Page Application (SPA).

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Login**:

    ```bash
    npx wrangler login
    ```

3.  **Deploy**:
    ```bash
    npm deploy
    ```

### Custom Domain

Default: `poemd.dev`.

To initialise a custom domain:

1.  Add domain to Cloudflare account.
2.  Update `wrangler.jsonc`:
    ```json
    {
      "routes": [{ "pattern": "your-domain.com", "custom_domain": true }]
    }
    ```
3.  Deploy (DNS/SSL handled automatically).
