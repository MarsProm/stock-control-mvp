export type Product = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currentStock: number;
  minimumStock: number;
  lowStock: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  code: string;
  name: string;
  description?: string;
  price: number;
  minimumStock: number;
  initialStock?: number;
};

export type MovementType = "ENTRY" | "EXIT";

export type Movement = {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  balanceAfter: number;
  actorUserId: string | null;
  saleId: string | null;
  createdAt: string;
};

export type MovementInput = {
  type: MovementType;
  quantity: number;
  reason: string;
};

export type PageResponse<T> = {
  content: T[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};
