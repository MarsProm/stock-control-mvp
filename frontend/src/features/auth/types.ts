export type BusinessRole = "ADMIN" | "CASHIER";

export type BusinessSummary = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  inventoryEnabled: boolean;
  posEnabled: boolean;
  reportsEnabled: boolean;
  role: BusinessRole | null;
  maxDiscountPercent: number | null;
};

export type Me = {
  id: string;
  email: string;
  platformAdministrator: boolean;
  businesses: BusinessSummary[];
};
