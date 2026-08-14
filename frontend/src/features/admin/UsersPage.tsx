import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { errorMessage } from "../../lib/api";
import type { BusinessRole } from "../auth/types";
import {
  inviteMember,
  listMembers,
  updateMember,
  type Member,
} from "./identity-api";

export function UsersPage() {
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: ["members"], queryFn: listMembers });
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    role: "CASHIER" as BusinessRole,
    maxDiscountPercent: 0,
  });
  const invite = useMutation({
    mutationFn: inviteMember,
    onSuccess: () =>
      setForm({
        email: "",
        displayName: "",
        role: "CASHIER",
        maxDiscountPercent: 0,
      }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    invite.mutate(form);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipo</p>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-description">
            Invitá administradores y cajeros, y definí cuánto descuento puede
            aplicar cada uno.
          </p>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <UserPlus size={19} /> Invitar usuario
          </h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Nombre">
              <input
                className="form-input"
                value={form.displayName}
                onChange={(event) =>
                  setForm({ ...form, displayName: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Email">
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Rol">
              <select
                className="form-input"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as BusinessRole })
                }
              >
                <option value="CASHIER">Cajero</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
            <Field label="Descuento máximo %">
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.maxDiscountPercent}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxDiscountPercent: Number(event.target.value),
                  })
                }
              />
            </Field>
            {invite.isError ? <Message error={invite.error} /> : null}
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
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <Users size={20} />
            <h2 className="font-semibold">Equipo</h2>
          </div>
          {members.isError ? (
            <div className="p-5">
              <Message error={members.error} />
            </div>
          ) : null}
          {members.isPending ? (
            <p
              role="status"
              className="animate-pulse p-5 text-sm text-slate-500"
            >
              Cargando equipo…
            </p>
          ) : null}
          <div className="divide-y divide-slate-100">
            {members.data?.map((member) => (
              <article
                key={member.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <ShieldCheck size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{member.displayName}</p>
                  <p className="truncate text-sm text-slate-500">
                    {member.email}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">
                    {member.role === "ADMIN" ? "Administrador" : "Cajero"}
                  </p>
                  <p className="text-slate-500">
                    Hasta {member.maxDiscountPercent}% desc.
                  </p>
                </div>
                <EditMemberDialog
                  member={member}
                  onSaved={() =>
                    queryClient.invalidateQueries({ queryKey: ["members"] })
                  }
                />
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function EditMemberDialog({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: member.displayName,
    role: member.role,
    active: member.active,
    maxDiscountPercent: member.maxDiscountPercent,
  });
  const update = useMutation({
    mutationFn: () => updateMember(member.id, form),
    onSuccess: async () => {
      await onSaved();
      setOpen(false);
    },
  });
  const reset = () =>
    setForm({
      displayName: member.displayName,
      role: member.role,
      active: member.active,
      maxDiscountPercent: member.maxDiscountPercent,
    });
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" className="button-secondary">
          <Pencil size={17} /> Editar
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-semibold">
                Editar usuario
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                {member.email}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Cerrar">
              <X size={19} />
            </Dialog.Close>
          </div>
          <div className="mt-6 space-y-4">
            <Field label="Nombre">
              <input
                className="form-input"
                value={form.displayName}
                onChange={(event) =>
                  setForm({ ...form, displayName: event.target.value })
                }
              />
            </Field>
            <Field label="Rol">
              <select
                className="form-input"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as BusinessRole })
                }
              >
                <option value="CASHIER">Cajero</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
            <Field label="Descuento máximo %">
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.maxDiscountPercent}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxDiscountPercent: Number(event.target.value),
                  })
                }
              />
            </Field>
            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
              />{" "}
              Usuario activo
            </label>
            {update.isError ? <Message error={update.error} /> : null}
            <button
              type="button"
              className="button-primary w-full"
              disabled={update.isPending}
              onClick={() => update.mutate()}
            >
              {update.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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

function Message({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {errorMessage(error)}
    </p>
  );
}
