/**
 * Central API configuration and network sync helpers for Flyer Stock AHP.
 * Ensures consistent connectivity whether accessing via Cloud Run, localhost,
 * different IP addresses, incognito windows, or external static hosts like netlify.app.
 */

// Public Cloud Run production backend for Flyer Stock AHP
export const CLOUD_BACKEND_URL = 'https://ais-dev-z6dza4olbxnpdv5jsg4roc-413909422609.europe-west2.run.app';

/**
 * Resolves the appropriate API endpoint URL based on current host environment.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    // If running on an external host like netlify.app without local node server, route to Cloud Run backend
    if (host.includes('netlify.app') || host.includes('vercel.app') || host.includes('github.io')) {
      return `${CLOUD_BACKEND_URL}${cleanPath}`;
    }
  }

  // When running on Cloud Run, localhost or reverse proxy, use same-origin relative path
  return cleanPath;
}

/**
 * Resolves the appropriate WebSocket URL based on current host environment.
 */
export function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.toLowerCase();
  if (host.includes('netlify.app') || host.includes('vercel.app') || host.includes('github.io')) {
    return CLOUD_BACKEND_URL.replace(/^http/i, 'ws');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

/**
 * Robust fetch helper that attempts primary URL and falls back to Cloud Run backend
 * if running on Netlify or if the primary endpoint returns 404/network error.
 */
export async function fetchWithFallback(path: string, options?: RequestInit): Promise<Response> {
  const primaryUrl = getApiUrl(path);

  try {
    const res = await fetch(primaryUrl, options);
    // If server responded with valid JSON status
    if (res.ok) {
      return res;
    }

    // If endpoint returned 404 or HTML (common on Netlify SPA rewrites), try Cloud Run fallback
    if (res.status === 404 || res.headers.get('content-type')?.includes('text/html')) {
      if (!primaryUrl.startsWith(CLOUD_BACKEND_URL)) {
        const fallbackUrl = `${CLOUD_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
        return await fetch(fallbackUrl, options);
      }
    }

    return res;
  } catch (err) {
    // On network failure, attempt fallback if not already tried
    if (!primaryUrl.startsWith(CLOUD_BACKEND_URL)) {
      const fallbackUrl = `${CLOUD_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
      return await fetch(fallbackUrl, options);
    }
    throw err;
  }
}

/**
 * Fetches latest stock state from central backend.
 */
export async function fetchStockData(): Promise<any> {
  const res = await fetchWithFallback('/api/stock/data', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load stock: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Pushes updated stock state to central backend.
 */
export async function syncStockToServer(payload: any): Promise<any> {
  const res = await fetchWithFallback('/api/stock/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to sync stock: HTTP ${res.status}`);
  }
  return await res.json();
}
