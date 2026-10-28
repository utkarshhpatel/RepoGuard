import '@testing-library/jest-dom';

// Polyfill window.matchMedia if not present in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: async () => {},
  },
});
