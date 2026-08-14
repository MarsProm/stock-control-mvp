import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Power, Send, Store } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "../../lib/api";
import { useAuth } from "../auth/auth-context";
import {
  createPlatformBusiness,
  inviteInitialAdministrator,
  listPlatformBusinesses,
  updatePlatformBusiness,
} from "./platform-api";

export function PlatformPage() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [businessForm, setBusinessForm] = useState({ name: "", slug: "" });
  const [invitationForm, setInvitationForm] = useState({
    businessId: "",
    displayName: "",
    email: "",
  });
  const businesses = useQuery({
    queryKey: ["platform-businesses"],
    queryFn: listPlatformBusinesses,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["platform-businesses"] });
  const create = useMutation({
    mutationFn: createPlatformBusiness,
    onSuccess: async (business) => {
      setBusinessForm({ name: "", slug: "" });
      setInvitationForm((current) => ({ ...current, businessId: business.id }));
      await refresh();
    },
  });
  const invite = useMutation({
    mutationFn: () =>
      inviteInitialAdministrator(invitationForm.businessId, invitationForm),
    onSuccess: () =>
      setInvitationForm((current) => ({
        ...current,
        displayName: "",
        email: "",
      })),
  });
  const status = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePlatformBusiness(id, active),
    onSuccess: refresh,
  });

  const submitBusiness = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(businessForm);
  };

  return (
    <main className="min-h-dvh bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Administración de plataforma</p>
            <h1 className="page-title">Tiendas</h1>
            <p className="page-description">
              Creá negocios, invitá al primer administrador y controlá su
              estado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/select-business" className="button-secondary">
              Volver a mis tiendas
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="button-secondary"
            >
              <LogOut size={17} /> Cerrar sesión
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[22rem_1fr]">
          <div className="space-y-6">
            <section className="panel p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Store size={19} /> Nueva tienda
              </h2>
              <form onSubmit={submitBusiness} className="mt-5 space-y-4">
                <Field label="Nombre comercial">
                  <input
                    className="form-input"
                    value={businessForm.name}
                    onChange={(event) =>
                      setBusinessForm({
                        ...businessForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Identificador">
                  <input
                    className="form-input"
                    value={businessForm.slug}
                    onChange={(event) =>
                      setBusinessForm({
                        ...businessForm,
                        slug: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    placeholder="mi-tienda"
                    required
                  />
                </Field>
                {create.isError ? <ErrorMessage error={create.error} /> : null}
                <button
                  className="button-primary w-full"
                  disabled={create.isPending}
                >
                  {create.isPending ? "Creando…" : "Crear tienda"}
                </button>
              </form>
            </section>

            <section className="panel p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Send size={19} /> Administrador inicial
              </h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  invite.mutate();
                }}
                className="mt-5 space-y-4"
              >
                <Field label="Tienda">
                  <select
                    className="form-input"
                    value={invitationForm.businessId}
                    onChange={(event) =>
                      setInvitationForm({
                        ...invitationForm,
                        businessId: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccionar</option>
                    {businesses.data
                      ?.filter((business) => business.active)
                      .map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Nombre">
                  <input
                    className="form-input"
                    value={invitationForm.displayName}
                    onChange={(event) =>
                      setInvitationForm({
                        ...invitationForm,
                        displayName: event.target.value,
                      })
                    }
                    required
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="form-input"
                    type="email"
                    value={invitationForm.email}
                    onChange={(event) =>
                      setInvitationForm({
                        ...invitationForm,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </Field>
                {invite.isError ? <ErrorMessage error={invite.error} /> : null}
                {invite.isSuccess ? (
                  <p
                    role="status"
                    className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                  >
                    Invitación enviada.
                  </p>
                ) : null}
                <button
                  className="button-primary w-full"
                  disabled={invite.isPending}
                >
                  {invite.isPending ? "Enviando…" : "Enviar invitación"}
                </button>
              </form>
            </section>
          </div>

          <section className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200 p-5">
              <Building2 size={20} />
              <h2 className="font-semibold">Negocios registrados</h2>
            </div>
            {businesses.isError ? (
              <div className="p-5">
                <ErrorMessage error={businesses.error} />
              </div>
            ) : null}
            {businesses.isPending ? (
              <LoadingMessage text="Cargando tiendas…" />
            ) : null}
            <div className="divide-y divide-slate-100">
              {businesses.data?.map((business) => (
                <article
                  key={business.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${business.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Store size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{business.name}</p>
                    <p className="text-sm text-slate-500">{business.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${business.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
                  >
                    {business.active ? "Activa" : "Inactiva"}
                  </span>
                  <button
                    type="button"
                    className={
                      business.active ? "button-secondary" : "button-primary"
                    }
                    disabled={status.isPending}
                    onClick={() =>
                      status.mutate({
                        id: business.id,
                        active: !business.active,
                      })
                    }
                  >
                    <Power size={17} />{" "}
                    {business.active ? "Desactivar" : "Activar"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
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

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {errorMessage(error)}
    </p>
  );
}

function LoadingMessage({ text }: { text: string }) {
  return (
    <p role="status" className="animate-pulse p-5 text-sm text-slate-500">
      {text}
    </p>
  );
}
