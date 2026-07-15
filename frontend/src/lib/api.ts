// Same-origin API client backed by Next.js route handlers and Supabase.

type FetchOptions = {
  method?: string
  body?: unknown
  token?: string
}

async function apiFetch<T>(endpoint: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const res = await fetch(`/api${endpoint}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
    credentials: 'same-origin',
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'API error')
  return data
}

// ── Products ─────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/products${qs}`)
  },
  get: (id: number | string) => apiFetch<any>(`/products/${id}`),
  create: (body: unknown, token: string) =>
    apiFetch<any>('/products', { method: 'POST', body, token }),
  update: (id: number, body: unknown, token: string) =>
    apiFetch<any>(`/products/${id}`, { method: 'PUT', body, token }),
  delete: (id: number, token: string) =>
    apiFetch<any>(`/products/${id}`, { method: 'DELETE', token }),
}

// ── Categories ───────────────────────────────────────────────
export const categoriesApi = {
  list: () => apiFetch<any>('/categories'),
}

// ── Orders ───────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: Record<string, string>, token?: string) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/orders${qs}`, { token })
  },
  get: (id: number, token?: string) => apiFetch<any>(`/orders/${id}`, { token }),
  create: (body: unknown) => apiFetch<any>('/orders', { method: 'POST', body }),
  update: (id: number, body: unknown, token: string) =>
    apiFetch<any>(`/orders/${id}`, { method: 'PUT', body, token }),
}

// ── Events ───────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/events${qs}`)
  },
  get: (id: number | string) => apiFetch<any>(`/events/${id}`),
  rsvp: (eventId: number, body: unknown) =>
    apiFetch<any>(`/events/${eventId}/rsvp`, { method: 'POST', body }),
  create: (body: unknown, token: string) =>
    apiFetch<any>('/events', { method: 'POST', body, token }),
  update: (id: number, body: unknown, token: string) =>
    apiFetch<any>(`/events/${id}`, { method: 'PUT', body, token }),
  delete: (id: number, token: string) =>
    apiFetch<any>(`/events/${id}`, { method: 'DELETE', token }),
}

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<any>('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token: string) => apiFetch<any>('/auth/me', { token }),
  logout: () => apiFetch<any>('/auth/logout', { method: 'POST' }),
}

// ── Dashboard ────────────────────────────────────────────────
export const dashboardApi = {
  stats: (token: string) => apiFetch<any>('/dashboard/stats', { token }),
}

// ── Newsletter ───────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (email: string, name?: string) =>
    apiFetch<any>('/newsletter', { method: 'POST', body: { email, name } }),
}

// ── Inventory ────────────────────────────────────────────────
export const inventoryApi = {
  list: (token: string, lowStock?: boolean) =>
    apiFetch<any>(`/inventory${lowStock ? '?low_stock=1' : ''}`, { token }),
  update: (id: number, stock: number, token: string) =>
    apiFetch<any>(`/inventory/${id}`, { method: 'PUT', body: { stock_quantity: stock }, token }),
}
