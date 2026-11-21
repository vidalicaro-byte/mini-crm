type Viewport = 'mobile' | 'desktop';

/**
 * jsdom has no matchMedia. This stub answers `min-width` queries according to the
 * chosen viewport and reports "no" to everything else (e.g. prefers-color-scheme).
 */
export function mockViewport(viewport: Viewport) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: viewport === 'desktop' && query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
