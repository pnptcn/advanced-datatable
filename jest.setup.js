// Mock the Web Components API
if (!window.customElements) {
  window.customElements = {
    define: jest.fn(),
  };
}

// Mock MessageChannel and MessagePort
global.MessageChannel = function() {
  return {
    port1: {
      onmessage: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    },
    port2: {
      onmessage: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    },
  };
};

global.MessagePort = function() {
  return {
    onmessage: jest.fn(),
    postMessage: jest.fn(),
    start: jest.fn(),
  };
};