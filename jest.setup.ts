import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = jest.fn();
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});
