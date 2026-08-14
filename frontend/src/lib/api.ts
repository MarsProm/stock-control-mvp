export type ApiProblem = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Array<{ pointer: string; code: string; detail: string }>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ApiProblem;

  constructor(status: number, problem?: ApiProblem) {
    const fallback =
      status === 401
        ? "No se pudo validar tu sesión. Intentá nuevamente en unos segundos."
        : status >= 500
          ? "El servidor no pudo completar la operación. Intentá nuevamente en unos segundos."
          : "No se pudo completar la operación";
    super(problem?.detail ?? fallback);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
let accessToken: string | null = null;
let selectedBusinessId = localStorage.getItem("stock-control:business-id");

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSelectedBusinessId(businessId: string | null) {
  selectedBusinessId = businessId;
  if (businessId) localStorage.setItem("stock-control:business-id", businessId);
  else localStorage.removeItem("stock-control:business-id");
}

export function getSelectedBusinessId() {
  if (!selectedBusinessId)
    throw new Error("Selecciona una tienda para continuar");
  return selectedBusinessId;
}

export function businessApiPath(path: string) {
  return `/api/v1/businesses/${getSelectedBusinessId()}${path}`;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let problem: ApiProblem | undefined;
    try {
      problem = (await response.json()) as ApiProblem;
    } catch {
      problem = undefined;
    }
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrio un error inesperado";
}
