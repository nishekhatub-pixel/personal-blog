import "@testing-library/jest-dom/vitest";

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) =>
    window.setTimeout(() => callback(performance.now()), 0);
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}

if (!window.matchMedia) {
  window.matchMedia = (query) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
