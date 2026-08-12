export type ApiProblem = {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Array<{ pointer: string; code: string; detail: string }>
}

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ApiProblem

  constructor(status: number, problem?: ApiProblem) {
    super(problem?.detail ?? 'No se pudo completar la operacion')
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let problem: ApiProblem | undefined
    try {
      problem = (await response.json()) as ApiProblem
    } catch {
      problem = undefined
    }
    throw new ApiError(response.status, problem)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado'
}
