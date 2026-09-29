/**
 * Base API simulation helper.
 * Simulates network delay and returns resolved promises.
 * In production or Phase 2, this can be swapped with axios/fetch instances.
 */

const DEFAULT_DELAY_MS = 250;

export async function simulateNetworkDelay(ms: number = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockFetch<T>(data: T, delayMs: number = DEFAULT_DELAY_MS): Promise<T> {
  await simulateNetworkDelay(delayMs);
  // Deep clone to prevent direct state mutation
  return JSON.parse(JSON.stringify(data));
}

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      return `https://${envUrl}`;
    }
    return envUrl;
  }

  // Automatic production Render detection
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://ayu-trial-fabric-api.onrender.com';
    }
  }

  return '';
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackData?: T
): Promise<T> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${apiBaseUrl}${endpoint}`;

    const activeRole =
      typeof window !== 'undefined'
        ? localStorage.getItem('ayu_trial_user_role') || 'Principal Investigator'
        : 'Principal Investigator';

    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': activeRole,
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const bodyText = await res.text();
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
      }
      throw new Error(`Invalid response format from API (received ${contentType || 'non-JSON'}). Backend may be waking up.`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `API error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    if (fallbackData !== undefined) {
      console.warn(`apiFetch fallback for ${endpoint}:`, err);
      return JSON.parse(JSON.stringify(fallbackData));
    }
    throw err;
  }
}


