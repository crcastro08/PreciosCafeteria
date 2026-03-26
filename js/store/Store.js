/**
 * Implements a simple predictable state container.
 * Principle of Immutability: Get returns frozen data.
 */
export class Store {
  constructor(initialState = {}) {
    this.state = {
      products: [],
      loading: false,
      error: null,
      activeCategory: 'Todos',
      ...initialState
    };
    this.listeners = [];
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    // Deep freeze prevents accidental modification by Views
    return Object.freeze({ ...this.state });
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  notify() {
    const frozenState = this.getState();
    this.listeners.forEach(listener => listener(frozenState));
  }
}
