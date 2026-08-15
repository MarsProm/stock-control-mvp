import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RegistersPage } from "./features/admin/RegistersPage";
import { PlatformPage } from "./features/admin/PlatformPage";
import { SalesPage } from "./features/admin/SalesPage";
import { SettingsPage } from "./features/admin/SettingsPage";
import { UsersPage } from "./features/admin/UsersPage";
import { useAuth } from "./features/auth/auth-context";
import { AcceptInvitationPage } from "./features/auth/AcceptInvitationPage";
import { useBusiness } from "./features/auth/business-context";
import { LoginPage } from "./features/auth/LoginPage";
import { SelectBusinessPage } from "./features/auth/SelectBusinessPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MovementHistoryPage } from "./features/movements/MovementHistoryPage";
import { PosPage } from "./features/pos/PosPage";
import { ProductsPage } from "./features/products/ProductsPage";

function App() {
  const { authenticated, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusiness();

  if (authLoading || (authenticated && businessLoading))
    return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {!authenticated ? (
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        <>
          <Route path="/select-business" element={<SelectBusinessPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/platform" element={<PlatformGuard />} />
          {!business ? (
            <Route
              path="*"
              element={<Navigate to="/select-business" replace />}
            />
          ) : (
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <Navigate
                    to={business.role === "ADMIN" ? "/admin/dashboard" : "/pos"}
                    replace
                  />
                }
              />
              <Route
                path="/pos"
                element={business.posEnabled ? <PosPage /> : <ModuleDisabled />}
              />
              <Route
                path="/admin/dashboard"
                element={
                  business.inventoryEnabled ? (
                    <DashboardPage />
                  ) : (
                    <ModuleDisabled />
                  )
                }
              />
              <Route
                path="/products"
                element={
                  business.inventoryEnabled ? (
                    <ProductsPage />
                  ) : (
                    <ModuleDisabled />
                  )
                }
              />
              <Route
                path="/sales"
                element={
                  business.reportsEnabled ? (
                    <SalesPage />
                  ) : (
                    <ModuleDisabled />
                  )
                }
              />
              {business.role === "ADMIN" ? (
                <>
                  <Route
                    path="/stock"
                    element={
                      business.inventoryEnabled ? (
                        <MovementHistoryPage />
                      ) : (
                        <ModuleDisabled />
                      )
                    }
                  />
                  <Route
                    path="/registers"
                    element={
                      business.posEnabled ? (
                        <RegistersPage />
                      ) : (
                        <ModuleDisabled />
                      )
                    }
                  />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </>
              ) : null}
              <Route
                path="*"
                element={
                  <Navigate
                    to={business.role === "ADMIN" ? "/admin/dashboard" : "/pos"}
                    replace
                  />
                }
              />
            </Route>
          )}
        </>
      )}
    </Routes>
  );
}

function PlatformGuard() {
  const { me } = useBusiness();
  return me?.platformAdministrator ? (
    <PlatformPage />
  ) : (
    <Navigate to="/select-business" replace />
  );
}

function ModuleDisabled() {
  return (
    <section className="panel mx-auto max-w-xl p-7 text-center">
      <h1 className="text-2xl font-semibold">Módulo desactivado</h1>
      <p className="mt-2 text-slate-600">
        Un administrador puede volver a habilitarlo desde Configuración.
      </p>
    </section>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 text-white">
      <div role="status" className="text-center">
        <span className="mx-auto block size-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />
        <p className="mt-4 text-sm text-slate-300">Preparando tu espacio…</p>
      </div>
    </main>
  );
}

export default App;
