/**
 * Formats an error response from the API
 * @param {Error} error - The error object from axios
 * @returns {Object} Formatted error response
 */
export function formatApiError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      status: error.response.status,
      statusText: error.response.statusText,
      message: error.response.data?.message || 'An error occurred',
      data: error.response.data,
      isApiError: true,
      originalError: error
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      statusText: 'No Response',
      message: 'No response received from server',
      isNetworkError: true,
      originalError: error
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      status: 0,
      statusText: 'Request Error',
      message: error.message || 'Error setting up request',
      isRequestError: true,
      originalError: error
    };
  }
}

/**
 * Handles API response and returns standardized format
 * @param {Object} response - Axios response object
 * @returns {Object} Standardized response
 */
export function handleApiResponse(response) {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config: response.config
  };
}

/**
 * Creates a mock response for development
 * @param {*} data - Mock data to return
 * @param {Object} options - Additional options
 * @returns {Object} Mock response object
 */
export function createMockResponse(data, options = {}) {
  const {
    status = 200,
    statusText = 'OK',
    delay = 500,
    shouldFail = false
  } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject({
          response: {
            status,
            statusText,
            data: {
              status: 'error',
              message: 'Mock error response',
              ...data
            }
          }
        });
      } else {
        resolve({
          data,
          status,
          statusText,
          config: {},
          headers: {}
        });
      }
    }, delay);
  });
}

/**
 * Formats query parameters for API requests
 * @param {Object} params - Query parameters
 * @returns {string} Formatted query string
 */
export function formatQueryParams(params) {
  if (!params) return '';
  
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  return query ? `?${query}` : '';
}

/**
 * Creates a cancellable promise for API requests
 * @param {Promise} promise - The promise to make cancellable
 * @returns {Object} Object with promise and cancel function
 */
export function makeCancellable(promise) {
  let isCancelled = false;
  
  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      val => (isCancelled ? reject({ isCancelled: true }) : resolve(val)),
      error => (isCancelled ? reject({ isCancelled: true }) : reject(error))
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      isCancelled = true;
    },
  };
}

/**
 * Retries a failed API request
 * @param {Function} fn - Function that returns a promise
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Promise that resolves with the result or rejects after all retries
 */
export function retryApiCall(fn, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptsLeft) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (attemptsLeft === 0) {
            reject(error);
            return;
          }
          
          console.warn(`Retry attempt ${retries - attemptsLeft + 1}/${retries}`, error);
          
          setTimeout(() => {
            attempt(attemptsLeft - 1);
          }, delay);
        });
    };
    
    attempt(retries);
  });
}
