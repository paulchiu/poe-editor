declare module '*.wasm' {
  const value: WebAssembly.Module
  export default value
}

declare module 'yoga-wasm-web/dist/yoga.wasm' {
  const value: WebAssembly.Module
  export default value
}

declare module '@resvg/resvg-wasm/index_bg.wasm' {
  const value: WebAssembly.Module
  export default value
}

// Extend Cloudflare Workers types for HTMLRewriter
declare global {
  interface Element {
    setInnerContent(content: string): void
  }

  interface Node {
    prepend(content: string, options?: { html?: boolean }): void
  }
}

export {}
