// utils/performanceUtils.js

// Request caching utilities
export class RequestCache {
  constructor(defaultDuration = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultDuration = defaultDuration;
  }

  generateKey(url, options = {}) {
    // Create a unique key based on URL and relevant options
    const keyData = {
      url,
      method: options.method || 'GET',
      body: options.body || null
    };
    return JSON.stringify(keyData);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.duration) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, duration = this.defaultDuration) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new RequestCache();

// Debounced fetch with caching
export const optimizedFetch = (() => {
  const pendingRequests = new Map();
  
  return async (url, options = {}, cacheOptions = {}) => {
    const {
      cache = true,
      cacheDuration = 5 * 60 * 1000,
      deduplicate = true
    } = cacheOptions;

    const key = globalCache.generateKey(url, options);
    
    // Check cache first
    if (cache) {
      const cachedResponse = globalCache.get(key);
      if (cachedResponse) {
        return Promise.resolve(cachedResponse);
      }
    }

    // Deduplicate concurrent requests
    if (deduplicate && pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }

    // Make the request
    const requestPromise = fetch(url, options)
      .then(async response => {
        const data = await response.json();
        
        if (response.ok && cache) {
          globalCache.set(key, { response, data }, cacheDuration);
        }
        
        return { response, data };
      })
      .catch(error => {
        console.warn('Fetch error:', error);
        throw error;
      })
      .finally(() => {
        pendingRequests.delete(key);
      });

    if (deduplicate) {
      pendingRequests.set(key, requestPromise);
    }

    return requestPromise;
  };
})();

// Debounced storage operations
export class OptimizedStorage {
  constructor(storage = sessionStorage) {
    this.storage = storage;
    this.debounceTimers = new Map();
    this.batchOperations = new Map();
  }

  // Debounced setItem
  setItem(key, value, delay = 1000) {
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      try {
        this.storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save ${key} to storage:`, error);
      }
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // Immediate getItem (no debouncing needed)
  getItem(key) {
    try {
      const value = this.storage.getItem(key);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from storage:`, error);
      return null;
    }
  }

  // Batch operations for efficiency
  batchSet(operations, delay = 1000) {
    const batchKey = 'batch_' + Date.now();
    
    const timer = setTimeout(() => {
      try {
        operations.forEach(({ key, value }) => {
          this.storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      } catch (error) {
        console.warn('Batch storage operation failed:', error);
      }
      this.batchOperations.delete(batchKey);
    }, delay);

    this.batchOperations.set(batchKey, timer);
  }

  // Force immediate save
  flush(key = null) {
    if (key && this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.delete(key);
      
      try {
        const value = this.pendingOperations?.get(key);
        if (value !== undefined) {
          this.storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`Failed to flush ${key}:`, error);
      }
    } else {
      // Flush all pending operations
      this.debounceTimers.forEach((timer, key) => {
        clearTimeout(timer);
      });
      this.debounceTimers.clear();
    }
  }

  // Cleanup
  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.batchOperations.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.batchOperations.clear();
  }
}

// Global storage instance
export const optimizedStorage = new OptimizedStorage();

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }

  startMark(name) {
    this.marks.set(name, performance.now());
  }

  endMark(name) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.measures.set(name, duration);
      this.marks.delete(name);
      return duration;
    }
    return null;
  }

  getMeasure(name) {
    return this.measures.get(name);
  }

  getAllMeasures() {
    return Object.fromEntries(this.measures);
  }

  logPerformance(name, threshold = 100) {
    const duration = this.getMeasure(name);
    if (duration && duration > threshold) {
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor();

// React hook for optimized API calls
export const useOptimizedFetch = (url, options = {}, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const fetchData = async () => {
      if (!url) return;
      
      setLoading(true);
      setError(null);
      
      try {
        perfMonitor.startMark(`fetch_${url}`);
        
        const { response, data: responseData } = await optimizedFetch(url, {
          ...options,
          signal: abortControllerRef.current.signal
        });
        
        perfMonitor.endMark(`fetch_${url}`);
        
        if (!isMounted) return;
        
        if (response.ok) {
          setData(responseData);
        } else {
          setError(new Error(responseData.message || 'Request failed'));
        }
      } catch (err) {
        if (!isMounted || err.name === 'AbortError') return;
        setError(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, ...deps]);

  return { data, loading, error };
};

// Memory usage utilities
export const memoryUtils = {
  getUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100
      };
    }
    return null;
  },

  logUsage: () => {
    const usage = memoryUtils.getUsage();
    if (usage) {
      console.log(`Memory usage: ${usage.used}MB / ${usage.total}MB (limit: ${usage.limit}MB)`);
    }
  },

  isHighUsage: (threshold = 0.8) => {
    const usage = memoryUtils.getUsage();
    return usage ? (usage.used / usage.limit) > threshold : false;
  }
};

// Cleanup utilities for component unmounting
export const createCleanupManager = () => {
  const timers = new Set();
  const eventListeners = new Set();
  const abortControllers = new Set();
  
  return {
    addTimer: (timer) => {
      timers.add(timer);
      return timer;
    },
    
    addEventListener: (element, event, handler, options) => {
      element.addEventListener(event, handler, options);
      eventListeners.add({ element, event, handler });
    },
    
    addAbortController: (controller) => {
      abortControllers.add(controller);
      return controller;
    },
    
    cleanup: () => {
      // Clear timers
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
      
      // Remove event listeners
      eventListeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (e) {
          console.warn('Failed to remove event listener:', e);
        }
      });
      eventListeners.clear();
      
      // Abort requests
      abortControllers.forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          console.warn('Failed to abort controller:', e);
        }
      });
      abortControllers.clear();
    }
  };
};

// Export default optimized storage instance
export default optimizedStorage;
