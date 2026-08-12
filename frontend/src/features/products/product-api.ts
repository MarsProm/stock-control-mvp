import { apiRequest } from '../../lib/api'
import type { Movement, MovementInput, PageResponse, Product, ProductInput } from './types'

export type ProductFilters = {
  query?: string
  active?: boolean
  lowStock?: boolean
  page?: number
  size?: number
  sort?: string
}

export function listProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams()
  if (filters.query) params.set('query', filters.query)
  params.set('active', String(filters.active ?? true))
  params.set('lowStock', String(filters.lowStock ?? false))
  params.set('page', String(filters.page ?? 0))
  params.set('size', String(filters.size ?? 20))
  params.set('sort', filters.sort ?? 'name,asc')
  return apiRequest<PageResponse<Product>>(`/api/v1/products?${params}`)
}

export function createProduct(input: ProductInput) {
  return apiRequest<Product>('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getProductByCode(code: string) {
  const params = new URLSearchParams({ code })
  return apiRequest<Product>(`/api/v1/products/by-code?${params}`)
}

export function updateProduct(productId: string, input: ProductInput) {
  const { initialStock: _initialStock, ...updateInput } = input
  return apiRequest<Product>(`/api/v1/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updateInput),
  })
}

export function deactivateProduct(productId: string) {
  return apiRequest<Product>(`/api/v1/products/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active: false }),
  })
}

export function createMovement(productId: string, input: MovementInput) {
  return apiRequest<Movement>(`/api/v1/products/${productId}/movements`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listMovements(
  productId: string,
  filters: { from?: string; to?: string; page?: number; size?: number } = {},
) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 20),
  })
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return apiRequest<PageResponse<Movement>>(
    `/api/v1/products/${productId}/movements?${params}`,
  )
}
