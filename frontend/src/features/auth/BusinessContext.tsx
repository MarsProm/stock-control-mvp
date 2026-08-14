import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, setSelectedBusinessId } from "../../lib/api";
import { useAuth } from "./auth-context";
import type { Me } from "./types";
import { BusinessContext, type BusinessContextValue } from "./business-context";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState(() =>
    localStorage.getItem("stock-control:business-id"),
  );
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest<Me>("/api/v1/me"),
    enabled: authenticated,
    retry: false,
  });

  useEffect(() => {
    if (authenticated) return;
    setBusinessId(null);
    setSelectedBusinessId(null);
    queryClient.removeQueries({ queryKey: ["me"] });
  }, [authenticated, queryClient]);

  useEffect(() => {
    if (!meQuery.data) return;
    const valid = meQuery.data.businesses.some(
      (business) => business.id === businessId,
    );
    const nextId = valid
      ? businessId
      : meQuery.data.businesses.length === 1
        ? meQuery.data.businesses[0].id
        : null;
    setBusinessId(nextId);
    setSelectedBusinessId(nextId);
  }, [businessId, meQuery.data]);

  const value = useMemo<BusinessContextValue>(
    () => ({
      me: meQuery.data,
      business: meQuery.data?.businesses.find(
        (candidate) => candidate.id === businessId,
      ),
      loading: meQuery.isPending,
      selectBusiness: (nextId) => {
        setBusinessId(nextId);
        setSelectedBusinessId(nextId);
        void queryClient.invalidateQueries();
      },
    }),
    [businessId, meQuery.data, meQuery.isPending, queryClient],
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
