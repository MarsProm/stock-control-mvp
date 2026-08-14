import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, MonitorUp, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { errorMessage } from "../../lib/api";
import {
  createRegister,
  listRegisters,
  listShifts,
  updateRegister,
} from "../pos/pos-api";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
const date = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function RegistersPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const registers = useQuery({
    queryKey: ["registers"],
    queryFn: listRegisters,
  });
  const shifts = useQuery({ queryKey: ["shifts"], queryFn: listShifts });
  const refreshRegisters = () =>
    queryClient.invalidateQueries({ queryKey: ["registers"] });
  const create = useMutation({
    mutationFn: createRegister,
    onSuccess: async () => {
      setName("");
      await refreshRegisters();
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      registerName,
      active,
    }: {
      id: string;
      registerName: string;
      active: boolean;
    }) => updateRegister(id, registerName, active),
    onSuccess: refreshRegisters,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) create.mutate(name.trim());
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Operación</p>
          <h1 className="page-title">Cajas y turnos</h1>
          <p className="page-description">
            Creá terminales y controlá aperturas, ventas y diferencias.
          </p>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <MonitorUp size={19} /> Cajas
          </h2>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="register-name">
              Nombre de caja
            </label>
            <input
              id="register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="form-input"
              placeholder="Ej. Caja principal"
            />
            <button
              type="submit"
              className="button-primary px-3"
              aria-label="Crear caja"
            >
              <Plus />
            </button>
          </form>
          {create.isError ? <ErrorMessage error={create.error} /> : null}
          {update.isError ? <ErrorMessage error={update.error} /> : null}
          {registers.isPending ? (
            <p
              role="status"
              className="mt-5 animate-pulse text-sm text-slate-500"
            >
              Cargando cajas…
            </p>
          ) : null}
          <div className="mt-5 space-y-2">
            {registers.data?.map((register) => (
              <div
                key={register.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 p-3"
              >
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {register.name}
                </span>
                <button
                  type="button"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({
                      id: register.id,
                      registerName: register.name,
                      active: !register.active,
                    })
                  }
                  className={`status-pill min-h-11 ${register.active ? "status-success" : "status-muted"}`}
                >
                  {register.active ? "Activa" : "Inactiva"}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Banknote size={19} /> Historial de turnos
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {shifts.isPending ? (
              <p
                role="status"
                className="animate-pulse p-5 text-sm text-slate-500"
              >
                Cargando turnos…
              </p>
            ) : null}
            {shifts.data?.content.map((shift) => (
              <article
                key={shift.id}
                className="grid gap-3 p-5 md:grid-cols-[1fr_repeat(3,auto)] md:items-center"
              >
                <div>
                  <p className="font-semibold">{shift.registerName}</p>
                  <p className="text-xs text-slate-500">
                    {date.format(new Date(shift.openedAt))}
                  </p>
                </div>
                <Metric
                  label="Ventas"
                  value={money.format(
                    shift.cashSales + shift.cardSales + shift.transferSales,
                  )}
                />
                <Metric
                  label="Efectivo esperado"
                  value={money.format(shift.expectedCash)}
                />
                <div className="md:text-right">
                  <span
                    className={`status-pill ${shift.status === "OPEN" ? "status-success" : "status-muted"}`}
                  >
                    {shift.status === "OPEN" ? "Abierto" : "Cerrado"}
                  </span>
                  {shift.difference != null ? (
                    <p
                      className={`mt-2 text-sm font-semibold ${shift.difference === 0 ? "text-slate-600" : "text-amber-700"}`}
                    >
                      Diferencia {money.format(shift.difference)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <p role="alert" className="mt-3 text-sm text-red-700">
      {errorMessage(error)}
    </p>
  );
}
