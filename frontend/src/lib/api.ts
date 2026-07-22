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
  uploadImage: (productId: number, file: File, isPrimary: boolean = false) => {
    const formData = new FormData()
    formData.append('product_id', String(productId))
    formData.append('image', file)
    formData.append('is_primary', String(isPrimary))
    return fetch('/api/upload', { method: 'POST', body: formData }).then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.message || 'API error')
      return data
    })
  },
  deleteImage: (objectPath: string, token: string) =>
    apiFetch<any>('/upload', { method: 'DELETE', body: { object_path: objectPath }, token }),
  reorderImages: (productId: number, imageIds: number[], token: string) =>
    apiFetch<any>(`/products/${productId}/images/reorder`, { method: 'PUT', body: { image_ids: imageIds }, token }),
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
  getHistory: (id: number, token: string) => apiFetch<any>(`/orders/${id}/history`, { token }),
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
  stats: (token: string, from?: string, to?: string) => {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<any>(`/dashboard/stats${qs}`, { token })
  },
}

// ── Newsletter ───────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (email: string, name?: string) =>
    apiFetch<any>('/newsletter', { method: 'POST', body: { email, name } }),
}

// ── Inventory ────────────────────────────────────────────────
export const inventoryApi = {
  list: (token: string, search?: string, lowStock?: boolean) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (lowStock) params.append('low_stock', '1')
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<any>(`/inventory${qs}`, { token })
  },
  update: (id: number, payload: { stock_quantity: number, reason: string, low_stock_threshold?: number }, token: string) =>
    apiFetch<any>(`/inventory/${id}`, { method: 'PUT', body: payload, token }),
  getMovements: (token: string, variantId?: number, page: number = 1) => {
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (variantId) params.append('variant_id', String(variantId))
    return apiFetch<any>(`/inventory/movements?${params.toString()}`, { token })
  },
}
