import { apiRequest, businessApiPath } from "../../lib/api";
import type { PageResponse } from "../products/types";
import type { PaymentMethod, Register, Sale, Shift } from "./types";

export function listRegisters() {
  return apiRequest<Register[]>(businessApiPath("/registers"));
}
export function createRegister(name: string) {
  return apiRequest<Register>(businessApiPath("/registers"), {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
export function updateRegister(id: string, name: string, active: boolean) {
  return apiRequest<Register>(businessApiPath(`/registers/${id}`), {
    method: "PATCH",
    body: JSON.stringify({ name, active }),
  });
}
export function getCurrentShift() {
  return apiRequest<Shift>(businessApiPath("/shifts/current"));
}
export function openShift(registerId: string, openingCash: number) {
  return apiRequest<Shift>(businessApiPath(`/registers/${registerId}/shifts`), {
    method: "POST",
    body: JSON.stringify({ openingCash }),
  });
}
export function closeShift(shiftId: string, countedCash: number) {
  return apiRequest<Shift>(businessApiPath(`/shifts/${shiftId}/close`), {
    method: "POST",
    body: JSON.stringify({ countedCash }),
  });
}
export function listShifts() {
  return apiRequest<PageResponse<Shift>>(businessApiPath("/shifts?size=100"));
}

export type CreateSaleInput = {
  shiftId: string;
  items: Array<{
    productId: string;
    quantity: number;
    discountPercent: number;
    discountReason?: string;
  }>;
  payments: Array<{
    method: PaymentMethod;
    amount: number;
    tenderedAmount?: number;
    reference?: string;
  }>;
};

export function createSale(input: CreateSaleInput) {
  return apiRequest<Sale>(businessApiPath("/sales"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function listSales() {
  return apiRequest<PageResponse<Sale>>(businessApiPath("/sales?size=100"));
}
export function getSale(saleId: string) {
  return apiRequest<Sale>(businessApiPath(`/sales/${saleId}/receipt`));
}
export function cancelSale(saleId: string, reason: string) {
  return apiRequest<Sale>(businessApiPath(`/sales/${saleId}/cancel`), {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
