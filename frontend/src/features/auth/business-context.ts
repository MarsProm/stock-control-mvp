import { createContext, useContext } from "react";
import type { BusinessSummary, Me } from "./types";

export type BusinessContextValue = {
  me?: Me;
  business?: BusinessSummary;
  loading: boolean;
  selectBusiness: (businessId: string) => void;
};

export const BusinessContext = createContext<BusinessContextValue | null>(null);

export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("BusinessProvider no esta disponible");
  return value;
}
