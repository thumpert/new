/**
 * StPageFlip ships no types of its own, so this declares the part we use.
 *
 * Narrow on purpose: only the constructor, the two calls that build and tear
 * down a book, and the handful of methods the reader's own controls need. A
 * fuller guess at the library's surface would be a fuller opportunity to be
 * wrong about it.
 */
declare module 'page-flip' {
  export interface PageFlipSettings {
    width: number
    height: number
    /** 'stretch' lets the book fill its container and follow the viewport. */
    size: 'fixed' | 'stretch'
    minWidth: number
    maxWidth: number
    minHeight: number
    maxHeight: number
    /** Draws the first and last sheets alone, as a real cover behaves. */
    showCover: boolean
    /** One page at a time on a narrow screen instead of a spread. */
    usePortrait: boolean
    maxShadowOpacity: number
    mobileScrollSupport: boolean
    drawShadow: boolean
    flippingTime: number
    useMouseEvents: boolean
    swipeDistance: number
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: Partial<PageFlipSettings>)
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void
    destroy(): void
    flipNext(): void
    flipPrev(): void
    getCurrentPageIndex(): number
    getPageCount(): number
    on(event: 'flip' | 'changeState' | 'init', handler: (event: { data: number }) => void): void
  }
}
