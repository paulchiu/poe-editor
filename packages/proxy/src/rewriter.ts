import { escapeHtml } from './utils'

/**
 * HTMLRewriter element content handlers interface
 */
export interface ElementContentHandlers {
  element?(element: Element): void | Promise<void>
  comments?(comment: Comment): void | Promise<void>
  text?(text: Text): void | Promise<void>
}

/**
 * Handler to remove existing meta tags
 */
export const removeElementHandler = {
  element(element: Element): void {
    element.remove()
  },
}

/**
 * Creates an HTMLRewriter handler for the <head> element to inject OG meta tags
 * @param title - The page title
 * @param snippet - The page snippet/description
 * @param ogImageUrl - The standard OG image URL
 * @param twitterOgImageUrl - The Twitter-specific OG image URL
 * @param url - The current page URL
 * @returns Element handler object for HTMLRewriter
 */
export function createHeadHandler(
  title: string,
  snippet: string,
  url: string
): ElementContentHandlers {
  const origin = new URL(url).origin
  return {
    element(element: Element): void {
      const metaTags = `
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(snippet)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Poe Markdown Editor" />
<meta property="og:logo" content="${origin}/favicon.svg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(snippet)}" />
<meta name="twitter:url" content="${url}" />
<meta name="description" content="${escapeHtml(snippet)}" />
`
      element.prepend(metaTags, { html: true })
    },
  }
}

/**
 * Creates an HTMLRewriter handler for the <title> element
 * @param title - The page title
 * @returns Element handler object for HTMLRewriter
 */
export function createTitleHandler(title: string): ElementContentHandlers {
  return {
    element(element: Element): void {
      element.setInnerContent(title)
    },
  }
}
