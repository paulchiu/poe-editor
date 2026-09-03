import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      /**
       * monaco-vim imports a pre-`exports` deep path that monaco-editor's exports
       * map now rewrites to a non-existent file. Redirect it to the supported
       * subpath so the bundle can resolve it.
       */
      'monaco-editor/esm/vs/editor/editor.api': 'monaco-editor/editor/editor.api',
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Monaco and Mermaid ship a few intentionally large pre-split assets.
    chunkSizeWarningLimit: 4_000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
