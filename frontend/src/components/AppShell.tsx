import {
  BarChart3,
  Boxes,
  Building2,
  History,
  LogOut,
  MonitorUp,
  PackageCheck,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { useBusiness } from "../features/auth/business-context";

export function AppShell() {
  const { signOut } = useAuth();
  const { business, me, selectBusiness } = useBusiness();
  const navigate = useNavigate();
  const admin = business?.role === "ADMIN";
  const navigation = [
    {
      to: "/pos",
      label: "Caja",
      icon: ShoppingCart,
      visible: business?.posEnabled,
    },
    {
      to: "/admin/dashboard",
      label: "Resumen",
      icon: BarChart3,
      visible: admin,
    },
    {
      to: "/products",
      label: "Productos",
      icon: Boxes,
      visible: admin && business?.inventoryEnabled,
    },
    {
      to: "/stock",
      label: "Movimientos",
      icon: History,
      visible: admin && business?.inventoryEnabled,
    },
    {
      to: "/sales",
      label: "Ventas",
      icon: ReceiptText,
      visible: admin && business?.reportsEnabled,
    },
    {
      to: "/registers",
      label: "Cajas",
      icon: MonitorUp,
      visible: admin && business?.posEnabled,
    },
    { to: "/users", label: "Usuarios", icon: Users, visible: admin },
    { to: "/settings", label: "Configuración", icon: Settings, visible: admin },
  ].filter((item) => item.visible);

  return (
    <div
      className="min-h-dvh bg-slate-50 text-slate-950"
      style={
        {
          "--brand": business?.primaryColor,
        } as React.CSSProperties
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:not-sr-only focus:rounded-lg focus:bg-white focus:px-4 focus:py-3"
      >
        Saltar al contenido
      </a>
      <aside className="business-sidebar fixed inset-y-0 left-0 z-30 hidden w-68 border-r p-4 text-white lg:flex lg:flex-col">
        <div className="mb-7 flex items-center gap-3 px-2 py-2">
          {business?.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="business-logo size-11 rounded-xl object-cover"
            />
          ) : (
            <span className="business-logo grid size-11 place-items-center rounded-xl bg-[var(--brand)] text-white">
              <PackageCheck />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{business?.name}</p>
            <p className="text-xs text-slate-400">Stock Control</p>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="space-y-1.5">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${isActive ? "brand-navigation-active" : "business-sidebar-link text-slate-300 hover:text-white"}`
              }
            >
              <Icon size={19} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="business-sidebar-divider mt-auto space-y-2 border-t pt-4">
          {me && me.businesses.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                selectBusiness("");
                navigate("/select-business");
              }}
              className="business-sidebar-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300"
            >
              <Building2 size={18} /> Cambiar tienda
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void signOut()}
            className="business-sidebar-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <strong>{business?.name}</strong>
          <button
            type="button"
            onClick={() => void signOut()}
            className="icon-button"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
        <nav
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Navegación principal"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${isActive ? "brand-navigation-mobile-active" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main
        id="main-content"
        className="px-4 py-6 sm:px-6 lg:ml-68 lg:px-8 lg:py-8"
      >
        <div className="mx-auto max-w-[1480px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
