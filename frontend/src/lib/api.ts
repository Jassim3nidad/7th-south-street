// Same-origin API client backed by Next.js route handlers and Supabase.

type FetchOptions = {
  method?: string
  body?: unknown
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
  create: (body: unknown) =>
    apiFetch<any>('/products', { method: 'POST', body }),
  update: (id: number, body: unknown) =>
    apiFetch<any>(`/products/${id}`, { method: 'PUT', body }),
  delete: (id: number) =>
    apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),
}

// ── Categories ───────────────────────────────────────────────
export const categoriesApi = {
  list: () => apiFetch<any>('/categories'),
}

// ── Orders ───────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<any>(`/orders${qs}`)
  },
  get: (id: number) => apiFetch<any>(`/orders/${id}`),
  create: (body: unknown) => apiFetch<any>('/orders', { method: 'POST', body }),
  update: (id: number, body: unknown) =>
    apiFetch<any>(`/orders/${id}`, { method: 'PUT', body }),
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
  create: (body: unknown) =>
    apiFetch<any>('/events', { method: 'POST', body }),
  update: (id: number, body: unknown) =>
    apiFetch<any>(`/events/${id}`, { method: 'PUT', body }),
  delete: (id: number) =>
    apiFetch<any>(`/events/${id}`, { method: 'DELETE' }),
}

// ── Dashboard ────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => apiFetch<any>('/dashboard/stats'),
}

// ── Newsletter ───────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (email: string, name?: string) =>
    apiFetch<any>('/newsletter', { method: 'POST', body: { email, name } }),
}

// ── Inventory ────────────────────────────────────────────────
export const inventoryApi = {
  list: (lowStock?: boolean) =>
    apiFetch<any>(`/inventory${lowStock ? '?low_stock=1' : ''}`),
  update: (id: number, stock: number) =>
    apiFetch<any>(`/inventory/${id}`, { method: 'PUT', body: { stock_quantity: stock } }),
}
