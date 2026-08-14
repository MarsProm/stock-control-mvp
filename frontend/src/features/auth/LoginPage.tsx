import { Eye, EyeOff, LockKeyhole, PackageCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { errorMessage } from "../../lib/api";
import { useAuth } from "./auth-context";

export function LoginPage() {
  const { authenticated, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  if (authenticated) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-500 text-slate-950">
            <PackageCheck />
          </span>
          <span className="text-lg font-semibold">Stock Control</span>
        </div>
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Caja e inventario
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Tu tienda, ordenada desde la primera venta.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Controla productos, cajas, usuarios y tickets desde un único lugar.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Acceso seguro para administradores y cajeros.
        </p>
      </section>

      <section className="grid place-items-center bg-slate-50 px-5 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9">
          <span className="mb-6 grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <LockKeyhole />
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-slate-600">
            Ingresá con la cuenta asignada a tu tienda.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Contraseña
              <span className="relative">
                <input
                  className="form-input pr-12"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label={
                    visible ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                No pudimos iniciar sesión. Revisá tus datos e intentá
                nuevamente.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="button-primary w-full"
            >
              {submitting ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
