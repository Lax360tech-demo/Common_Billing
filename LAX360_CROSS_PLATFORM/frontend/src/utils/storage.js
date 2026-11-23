// Cross-platform key-value persistence helper
const memoryFallback = {};

export const storage = {
  getItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // ignore
    }
    return memoryFallback[key] || null;
  },
  setItem: async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // ignore
    }
    memoryFallback[key] = value;
  },
  removeItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // ignore
    }
    delete memoryFallback[key];
  }
};
