import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ReceiptText, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { errorMessage } from "../../lib/api";
import { useBusiness } from "../auth/business-context";
import { cancelSale, listSales } from "../pos/pos-api";
import { ReceiptView } from "../pos/ReceiptView";
import type { Sale } from "../pos/types";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
const date = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function SalesPage() {
  const { business } = useBusiness();
  const admin = business?.role === "ADMIN";
  const queryClient = useQueryClient();
  const sales = useQuery({
    queryKey: ["sales", business?.id],
    queryFn: listSales,
    enabled: Boolean(business),
  });
  const [selected, setSelected] = useState<Sale>();
  const [reason, setReason] = useState("");
  const cancel = useMutation({
    mutationFn: ({
      id,
      reason: cancellationReason,
    }: {
      id: string;
      reason: string;
    }) => cancelSale(id, cancellationReason),
    onSuccess: async (sale) => {
      setSelected(sale);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["shifts"] }),
      ]);
    },
  });
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Auditoría</p>
          <h1 className="page-title">Ventas</h1>
          <p className="page-description">
            Consultá tickets, pagos y anulaciones de la tienda.
          </p>
        </div>
      </header>
      <section className="panel overflow-hidden">
        {sales.isError ? (
          <p
            role="alert"
            className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage(sales.error)}
          </p>
        ) : null}
        {sales.isPending ? (
          <p role="status" className="animate-pulse p-5 text-sm text-slate-500">
            Cargando ventas…
          </p>
        ) : null}
        <div className="hidden overflow-x-auto md:block">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Fecha</th>
                <th>Caja</th>
                <th>Estado</th>
                <th>Total</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.data?.content.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-semibold">{sale.number}</td>
                  <td>{date.format(new Date(sale.createdAt))}</td>
                  <td>{sale.registerName}</td>
                  <td>
                    <span
                      className={`status-pill ${sale.status === "COMPLETED" ? "status-success" : "status-danger"}`}
                    >
                      {sale.status === "COMPLETED" ? "Completada" : "Anulada"}
                    </span>
                  </td>
                  <td className="font-semibold tabular-nums">
                    {money.format(sale.total)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(sale)}
                      className="icon-button ml-auto"
                      aria-label={`Ver ${sale.number}`}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {sales.data?.content.map((sale) => (
            <button
              type="button"
              key={sale.id}
              onClick={() => setSelected(sale)}
              className="flex min-h-20 w-full items-center gap-3 p-4 text-left"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-slate-100">
                <ReceiptText size={18} />
              </span>
              <span className="flex-1">
                <strong className="block">{sale.number}</strong>
                <small className="text-slate-500">
                  {date.format(new Date(sale.createdAt))}
                </small>
              </span>
              <strong>{money.format(sale.total)}</strong>
            </button>
          ))}
        </div>
      </section>
      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(undefined);
            setReason("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60" />
          <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8">
            <Dialog.Title className="sr-only">Detalle de venta</Dialog.Title>
            <div className="mx-auto mb-4 flex max-w-md justify-end gap-2 print:hidden">
              {admin && selected?.status === "COMPLETED" ? (
                <div className="flex flex-1 gap-2">
                  <input
                    className="form-input"
                    placeholder="Motivo de anulación"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <button
                    type="button"
                    disabled={!reason.trim() || cancel.isPending}
                    onClick={() =>
                      selected && cancel.mutate({ id: selected.id, reason })
                    }
                    className="button-danger"
                  >
                    <RotateCcw size={17} /> Anular
                  </button>
                </div>
              ) : null}
              <Dialog.Close
                className="icon-button bg-white"
                aria-label="Cerrar"
              >
                <X />
              </Dialog.Close>
            </div>
            {cancel.isError ? (
              <p
                role="alert"
                className="mx-auto mb-3 max-w-md rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage(cancel.error)}
              </p>
            ) : null}
            {selected ? <ReceiptView sale={selected} /> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
