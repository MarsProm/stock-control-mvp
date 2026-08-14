import { Printer, RotateCcw } from "lucide-react";
import type { Sale } from "./types";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
const dateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});
const paymentLabels = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

export function ReceiptView({
  sale,
  onNewSale,
}: {
  sale: Sale;
  onNewSale?: () => void;
}) {
  return (
    <section
      className="receipt-sheet mx-auto w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-xl print:shadow-none"
      style={
        {
          "--receipt-primary": sale.primaryColor,
          "--receipt-accent": sale.accentColor,
        } as React.CSSProperties
      }
    >
      <header className="border-b border-dashed border-slate-300 pb-5 text-center">
        {sale.logoUrl ? (
          <img
            src={sale.logoUrl}
            alt=""
            className="mx-auto mb-3 size-14 rounded-xl object-cover"
          />
        ) : null}
        <h1 className="text-xl font-bold">{sale.businessName}</h1>
        {sale.receiptHeader ? (
          <p className="mt-1 text-sm">{sale.receiptHeader}</p>
        ) : null}
        <p className="mt-3 font-mono text-sm font-semibold">{sale.number}</p>
        <p className="text-xs text-slate-500">
          {dateTime.format(new Date(sale.createdAt))} · Caja {sale.registerName}
        </p>
      </header>
      <div className="divide-y divide-dashed divide-slate-200 py-3">
        {sale.items.map((item) => (
          <div key={item.id} className="py-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-semibold">{item.name}</span>
              <span className="font-semibold tabular-nums">
                {money.format(item.total)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.quantity} × {money.format(item.unitPrice)}
              {item.discountPercent > 0
                ? ` · ${item.discountPercent}% desc.`
                : ""}
            </p>
          </div>
        ))}
      </div>
      <dl className="space-y-2 border-y border-dashed border-slate-300 py-4 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{money.format(sale.subtotal)}</dd>
        </div>
        {sale.discountTotal > 0 ? (
          <div className="flex justify-between">
            <dt>Descuentos</dt>
            <dd className="tabular-nums">
              -{money.format(sale.discountTotal)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between text-lg font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{money.format(sale.total)}</dd>
        </div>
      </dl>
      <div className="space-y-2 py-4 text-sm">
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <span>{paymentLabels[payment.method]}</span>
            <span>{money.format(payment.amount)}</span>
          </div>
        ))}
        {sale.payments
          .filter((payment) => payment.method === "CASH")
          .map((payment) => (
            <div
              key={`${payment.id}-cash`}
              className="mt-2 space-y-1 text-xs text-slate-600"
            >
              <div className="flex justify-between">
                <span>Recibido</span>
                <span>
                  {money.format(payment.tenderedAmount ?? payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vuelto</span>
                <span>{money.format(payment.changeAmount)}</span>
              </div>
            </div>
          ))}
      </div>
      <footer className="border-t border-dashed border-slate-300 pt-4 text-center text-xs leading-5 text-slate-600">
        {sale.receiptFooter ? (
          <p>{sale.receiptFooter}</p>
        ) : (
          <p>Gracias por tu compra.</p>
        )}
        <p className="receipt-legal mt-3 font-semibold">
          Comprobante interno — no válido como factura
        </p>
      </footer>
      <div className="mt-6 grid gap-3 print:hidden sm:grid-cols-2">
        {onNewSale ? (
          <button
            type="button"
            onClick={onNewSale}
            className="button-secondary"
          >
            <RotateCcw size={18} /> Nueva venta
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => window.print()}
          className="button-primary"
        >
          <Printer size={18} /> Imprimir ticket
        </button>
      </div>
    </section>
  );
}
