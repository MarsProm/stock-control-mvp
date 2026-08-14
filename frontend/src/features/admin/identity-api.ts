import { apiRequest, businessApiPath } from "../../lib/api";
import type { BusinessRole } from "../auth/types";

export type Member = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: BusinessRole;
  active: boolean;
  maxDiscountPercent: number;
};
export type BusinessSettings = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  inventoryEnabled: boolean;
  posEnabled: boolean;
  reportsEnabled: boolean;
};

export function listMembers() {
  return apiRequest<Member[]>(businessApiPath("/members"));
}
export function inviteMember(input: {
  email: string;
  displayName: string;
  role: BusinessRole;
  maxDiscountPercent: number;
}) {
  return apiRequest<{ id: string }>(businessApiPath("/invitations"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}
export function updateMember(
  id: string,
  input: Omit<Member, "id" | "userId" | "email">,
) {
  return apiRequest<Member>(businessApiPath(`/members/${id}`), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export function getSettings() {
  return apiRequest<BusinessSettings>(businessApiPath("/settings"));
}
export function updateSettings(
  input: Omit<BusinessSettings, "id" | "slug" | "logoUrl">,
) {
  return apiRequest<BusinessSettings>(businessApiPath("/settings"), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
export function uploadLogo(file: File) {
  const form = new FormData();
  form.append("logo", file);
  return apiRequest<BusinessSettings>(businessApiPath("/settings/logo"), {
    method: "POST",
    body: form,
    headers: {},
  });
}
