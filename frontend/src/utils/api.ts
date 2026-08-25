const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // On localhost, use local Python backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // On Vercel or any production host, use relative paths (Next.js API routes)
    return '';
  }
  return '';
};

export const getApiBaseUrl = () => getBaseUrl();

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  // Normalize endpoint to always start with /api
  let targetEndpoint = endpoint;
  if (!targetEndpoint.startsWith('/api') && targetEndpoint !== '/health') {
    targetEndpoint = `/api${targetEndpoint}`;
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = baseUrl ? `${baseUrl}${targetEndpoint}` : targetEndpoint;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((d: any) => d.msg || d.detail || JSON.stringify(d)).join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      const rawText = await response.text().catch(() => '');
      errorMessage = `Server Error (${response.status}): ${rawText.substring(0, 100)}`;
    }
    throw new Error(errorMessage || `Server returned HTTP ${response.status}`);
  }

  return response.json();
};
