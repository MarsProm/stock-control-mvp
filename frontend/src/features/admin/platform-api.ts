import { apiRequest } from "../../lib/api";
import type { BusinessRole, BusinessSummary } from "../auth/types";

export function listPlatformBusinesses() {
  return apiRequest<BusinessSummary[]>("/api/v1/platform/businesses");
}

export function createPlatformBusiness(input: { name: string; slug: string }) {
  return apiRequest<BusinessSummary>("/api/v1/platform/businesses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlatformBusiness(id: string, active: boolean) {
  return apiRequest<BusinessSummary>(`/api/v1/platform/businesses/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function inviteInitialAdministrator(
  businessId: string,
  input: { email: string; displayName: string },
) {
  return apiRequest<{ id: string }>(
    `/api/v1/businesses/${businessId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        role: "ADMIN" satisfies BusinessRole,
        maxDiscountPercent: 100,
      }),
    },
  );
}
