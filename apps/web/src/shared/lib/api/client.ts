const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiClient(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;

  // Try to get Supabase session token for auth
  let authToken: string | undefined;
  if (typeof window !== 'undefined') {
    try {
      const { createSupabaseBrowserClient } = await import('@/shared/lib/supabase/client');
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      authToken = session?.access_token;
    } catch {
      // No auth available, proceed without token
    }
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  return fetch(url, { ...options, headers });
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClientJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiClient(path, options);

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Request failed: ${response.status}`;

    try {
      const body = await response.json();
      if (body?.error) {
        code = body.error.code || code;
        message = body.error.message || message;
      }
    } catch {
      // Non-JSON error response
    }

    throw new ApiError(response.status, code, message);
  }

  return response.json();
}
