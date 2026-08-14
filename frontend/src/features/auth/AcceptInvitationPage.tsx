import { CheckCircle2, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { errorMessage } from "../../lib/api";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";

export function AcceptInvitationPage() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  if (!authenticated) return <Navigate to="/login" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      if (!supabase) throw new Error("Supabase Auth no está configurado");
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      navigate("/select-business", { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <KeyRound />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Completá tu invitación
        </h1>
        <p className="mt-2 text-slate-600">
          Elegí una contraseña para volver a ingresar a Stock Control.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label="Nueva contraseña">
            <input
              className="form-input"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Field label="Repetir contraseña">
            <input
              className="form-input"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </Field>
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          <button className="button-primary w-full" disabled={submitting}>
            <CheckCircle2 size={18} />{" "}
            {submitting ? "Guardando…" : "Guardar y continuar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
