import { ArrowRight, Building2, LogOut } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useBusiness } from "./business-context";
import { useAuth } from "./auth-context";

export function SelectBusinessPage() {
  const { me, business, selectBusiness } = useBusiness();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  if (business) return <Navigate to="/" replace />;
  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-emerald-700">
            Cuenta activa
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="button-secondary"
          >
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Elegí una tienda
        </h1>
        <p className="mt-2 text-slate-600">
          Cada tienda mantiene separados sus productos, cajas y ventas.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {me?.businesses.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                selectBusiness(item.id);
                navigate("/");
              }}
              className="group flex min-h-32 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-lg">{item.name}</strong>
                <span className="mt-1 block text-sm text-slate-500">
                  {item.role === "ADMIN" ? "Administrador" : "Cajero"}
                </span>
              </span>
              <ArrowRight className="text-slate-400 transition group-hover:text-emerald-600" />
            </button>
          ))}
        </div>
        {me?.platformAdministrator ? (
          <Link to="/platform" className="button-secondary mt-6">
            <Building2 size={18} /> Administrar plataforma
          </Link>
        ) : null}
        {me?.businesses.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            Tu cuenta todavía no está asociada a una tienda. Pedile al
            administrador que revise la invitación.
          </p>
        ) : null}
      </div>
    </main>
  );
}
