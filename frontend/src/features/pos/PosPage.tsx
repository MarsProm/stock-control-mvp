import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Camera,
  CreditCard,
  LogOut,
  Minus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, errorMessage } from "../../lib/api";
import { useBusiness } from "../auth/business-context";
import { getProductByCode, listProducts } from "../products/product-api";
import type { Product } from "../products/types";
import {
  closeShift,
  createSale,
  getCurrentShift,
  listRegisters,
  openShift,
  type CreateSaleInput,
} from "./pos-api";
import { ReceiptView } from "./ReceiptView";
import type { PaymentMethod, Sale } from "./types";

const BarcodeScannerDialog = lazy(() =>
  import("../products/BarcodeScannerDialog").then((module) => ({
    default: module.BarcodeScannerDialog,
  })),
);
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

type CartItem = {
  product: Product;
  quantity: number;
  discountPercent: number;
  discountReason: string;
};

export function PosPage() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<Sale>();
  const [scanError, setScanError] = useState<string>();
  const scanInputRef = useRef<HTMLInputElement>(null);

  const products = useQuery({
    queryKey: ["products", "pos", search],
    queryFn: () => listProducts({ query: search, size: 40 }),
    enabled: Boolean(business),
  });
  const registers = useQuery({
    queryKey: ["registers", business?.id],
    queryFn: listRegisters,
    enabled: Boolean(business),
  });
  const shift = useQuery({
    queryKey: ["shift", "current", business?.id],
    queryFn: getCurrentShift,
    enabled: Boolean(business),
    retry: false,
  });
  const open = useMutation({
    mutationFn: ({
      registerId,
      openingCash,
    }: {
      registerId: string;
      openingCash: number;
    }) => openShift(registerId, openingCash),
    onSuccess: async (openedShift) => {
      queryClient.setQueryData(
        ["shift", "current", business?.id],
        openedShift,
      );
      await queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
  const sell = useMutation({
    mutationFn: createSale,
    onSuccess: async (sale) => {
      setReceipt(sale);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["shift"] }),
      ]);
    },
  });
  const close = useMutation({
    mutationFn: ({
      shiftId,
      countedCash,
    }: {
      shiftId: string;
      countedCash: number;
    }) => closeShift(shiftId, countedCash),
    onSuccess: async () => {
      setCart([]);
      queryClient.setQueryData(
        ["shift", "current", business?.id],
        null,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["registers"] }),
      ]);
    },
  });

  const totals = useMemo(
    () =>
      cart.reduce(
        (result, item) => {
          const subtotal = item.product.price * item.quantity;
          return {
            subtotal: result.subtotal + subtotal,
            total: result.total + subtotal * (1 - item.discountPercent / 100),
          };
        },
        { subtotal: 0, total: 0 },
      ),
    [cart],
  );

  const addProduct = (product: Product) => {
    if (!product.active || product.currentStock <= 0)
      throw new Error("El producto no tiene stock disponible");
    setCart((items) => {
      const current = items.find((item) => item.product.id === product.id);
      if (current)
        return items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.currentStock),
              }
            : item,
        );
      return [
        ...items,
        { product, quantity: 1, discountPercent: 0, discountReason: "" },
      ];
    });
    setSearch("");
    scanInputRef.current?.focus();
  };

  const scan = async (code: string) => {
    try {
      setScanError(undefined);
      addProduct(await getProductByCode(code));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404)
        throw new Error(
          "Código desconocido. Un administrador debe registrar el producto.",
        );
      throw cause;
    }
  };

  if (receipt)
    return (
      <ReceiptView
        sale={receipt}
        onNewSale={() => {
          setReceipt(undefined);
          setCart([]);
          scanInputRef.current?.focus();
        }}
      />
    );

  return (
    <div className="min-h-[calc(100dvh-8rem)]">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Modo cajero</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Nueva venta
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {shift.data
              ? `${shift.data.registerName} · Turno abierto`
              : "Abrí un turno para comenzar a vender"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="button-secondary"
          >
            <Camera size={18} /> Usar cámara
          </button>
          {shift.data ? (
            <CloseShiftDialog
              shift={shift.data}
              pending={close.isPending}
              error={close.isError ? errorMessage(close.error) : undefined}
              onClose={(countedCash) =>
                close.mutateAsync({ shiftId: shift.data.id, countedCash })
              }
            />
          ) : null}
        </div>
      </header>

      {!shift.data ? (
        <OpenShiftPanel
          registers={registers.data ?? []}
          pending={open.isPending}
          error={open.isError ? errorMessage(open.error) : undefined}
          onOpen={(registerId, openingCash) =>
            open.mutate({ registerId, openingCash })
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <section className="min-w-0">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (search.trim())
                  void scan(search.trim()).catch((cause) =>
                    setScanError(errorMessage(cause)),
                  );
              }}
              className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <label className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <span className="sr-only">Buscar o escanear producto</span>
                <input
                  ref={scanInputRef}
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="form-input min-h-14 pl-12 text-base"
                  placeholder="Escaneá el código o buscá por nombre"
                  autoComplete="off"
                />
              </label>
              <button type="submit" className="button-primary min-h-14 px-6">
                <ScanBarcode size={20} /> Agregar por código
              </button>
            </form>
            <p className="mb-4 text-sm text-slate-500">
              Escaneá un código y presioná Enter. Para buscar por nombre,
              elegí el producto en la lista.
            </p>
            {scanError ? (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
              >
                {scanError}
              </p>
            ) : null}
            {products.isError ? (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {errorMessage(products.error)}
              </p>
            ) : null}
            {products.isPending ? (
              <p
                role="status"
                className="mb-4 animate-pulse rounded-xl bg-white p-4 text-sm text-slate-500"
              >
                Cargando productos…
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {products.data?.content.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => addProduct(product)}
                  disabled={product.currentStock === 0}
                  className="brand-interactive min-h-32 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                >
                  <span className="line-clamp-2 font-semibold">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {product.code}
                  </span>
                  <span className="mt-5 flex items-end justify-between">
                    <strong className="text-lg tabular-nums">
                      {money.format(product.price)}
                    </strong>
                    <small className="text-slate-500">
                      Stock {product.currentStock}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <CartPanel
            cart={cart}
            maxDiscount={business?.maxDiscountPercent ?? 0}
            subtotal={totals.subtotal}
            total={totals.total}
            onChange={setCart}
            onCheckout={(payments) =>
              sell.mutate({
                shiftId: shift.data.id,
                items: cart.map((item) => ({
                  productId: item.product.id,
                  quantity: item.quantity,
                  discountPercent: item.discountPercent,
                  discountReason: item.discountReason || undefined,
                })),
                payments,
              })
            }
            pending={sell.isPending}
            error={sell.isError ? errorMessage(sell.error) : undefined}
          />
        </div>
      )}
      {scanOpen ? (
        <Suspense fallback={null}>
          <BarcodeScannerDialog
            onClose={() => setScanOpen(false)}
            onDetected={async (code) => {
              await scan(code);
              setScanOpen(false);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function OpenShiftPanel({
  registers,
  pending,
  error,
  onOpen,
}: {
  registers: Array<{ id: string; name: string; active: boolean }>;
  pending: boolean;
  error?: string;
  onOpen: (registerId: string, openingCash: number) => void;
}) {
  const [registerId, setRegisterId] = useState("");
  const [openingCash, setOpeningCash] = useState(0);
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <span className="brand-surface grid size-14 place-items-center rounded-2xl">
        <Banknote />
      </span>
      <h2 className="mt-5 text-2xl font-semibold">Abrir turno de caja</h2>
      <p className="mt-2 text-slate-600">
        Elegí la terminal e ingresá el efectivo disponible al comenzar.
      </p>
      <div className="mt-6 space-y-4">
        <label className="grid gap-2 text-sm font-semibold">
          Caja
          <select
            className="form-input"
            value={registerId}
            onChange={(event) => setRegisterId(event.target.value)}
          >
            <option value="">Seleccionar caja</option>
            {registers
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Efectivo inicial
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={openingCash}
            onChange={(event) => setOpeningCash(Number(event.target.value))}
          />
        </label>
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!registerId || pending}
          onClick={() => onOpen(registerId, openingCash)}
          className="button-primary w-full"
        >
          {pending ? "Abriendo…" : "Abrir turno"}
        </button>
      </div>
    </section>
  );
}

function CartPanel({
  cart,
  maxDiscount,
  subtotal,
  total,
  onChange,
  onCheckout,
  pending,
  error,
}: {
  cart: CartItem[];
  maxDiscount: number;
  subtotal: number;
  total: number;
  onChange: (items: CartItem[]) => void;
  onCheckout: (payments: CreateSaleInput["payments"]) => void;
  pending: boolean;
  error?: string;
}) {
  const update = (productId: string, changes: Partial<CartItem>) =>
    onChange(
      cart.map((item) =>
        item.product.id === productId ? { ...item, ...changes } : item,
      ),
    );
  return (
    <aside className="xl:sticky xl:top-8 xl:self-start">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-950/5">
        <header className="flex items-center gap-3 border-b border-slate-200 p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-slate-950 text-white">
            <ShoppingCart size={20} />
          </span>
          <div>
            <h2 className="font-semibold">Carrito</h2>
            <p className="text-xs text-slate-500">{cart.length} productos</p>
          </div>
        </header>
        <div className="max-h-[48dvh] divide-y divide-slate-100 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Escaneá o elegí un producto para comenzar.
            </div>
          ) : (
            cart.map((item) => (
              <article key={item.product.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-xs text-slate-500">
                      {money.format(item.product.price)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        cart.filter(
                          (candidate) =>
                            candidate.product.id !== item.product.id,
                        ),
                      )
                    }
                    className="icon-button size-10"
                    aria-label={`Quitar ${item.product.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        update(item.product.id, {
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      className="grid size-10 place-items-center"
                      aria-label="Restar unidad"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-9 text-center font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        update(item.product.id, {
                          quantity: Math.min(
                            item.product.currentStock,
                            item.quantity + 1,
                          ),
                        })
                      }
                      className="grid size-10 place-items-center"
                      aria-label="Sumar unidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong>
                    {money.format(
                      item.product.price *
                        item.quantity *
                        (1 - item.discountPercent / 100),
                    )}
                  </strong>
                </div>
                {maxDiscount > 0 ? (
                  <div className="mt-3 grid grid-cols-[6rem_1fr] gap-2">
                    <label className="text-xs text-slate-500">
                      Descuento %
                      <input
                        type="number"
                        min="0"
                        max={maxDiscount}
                        step="0.01"
                        value={item.discountPercent}
                        onChange={(event) =>
                          update(item.product.id, {
                            discountPercent: Math.min(
                              maxDiscount,
                              Number(event.target.value),
                            ),
                          })
                        }
                        className="form-input mt-1 min-h-10 py-1"
                      />
                    </label>
                    <label className="text-xs text-slate-500">
                      Motivo
                      <input
                        value={item.discountReason}
                        onChange={(event) =>
                          update(item.product.id, {
                            discountReason: event.target.value,
                          })
                        }
                        disabled={item.discountPercent === 0}
                        className="form-input mt-1 min-h-10 py-1"
                      />
                    </label>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
        <footer className="border-t border-slate-200 bg-slate-50 p-5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{money.format(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span className="tabular-nums">{money.format(total)}</span>
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          <CheckoutDialog
            total={total}
            disabled={
              cart.length === 0 ||
              pending ||
              cart.some(
                (item) =>
                  item.discountPercent > 0 && !item.discountReason.trim(),
              )
            }
            onConfirm={onCheckout}
          />
        </footer>
      </section>
    </aside>
  );
}

function CheckoutDialog({
  total,
  disabled,
  onConfirm,
}: {
  total: number;
  disabled: boolean;
  onConfirm: (payments: CreateSaleInput["payments"]) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cash, setCash] = useState(total);
  const [secondaryMethod, setSecondaryMethod] = useState<PaymentMethod | "">(
    "",
  );
  const [secondaryAmount, setSecondaryAmount] = useState(0);
  const primaryAmount = Math.max(0, total - secondaryAmount);
  useEffect(() => {
    setCash(total);
    setSecondaryAmount(0);
    setSecondaryMethod("");
  }, [total]);
  const methods = [
    { id: "CASH" as const, label: "Efectivo", icon: Banknote },
    { id: "CARD" as const, label: "Tarjeta", icon: CreditCard },
    { id: "TRANSFER" as const, label: "Transferencia", icon: WalletCards },
  ];
  const confirm = () => {
    const payments: CreateSaleInput["payments"] = [
      {
        method,
        amount: Number(primaryAmount.toFixed(2)),
        ...(method === "CASH"
          ? { tenderedAmount: Number(Math.max(cash, primaryAmount).toFixed(2)) }
          : {}),
      },
    ];
    if (secondaryMethod && secondaryAmount > 0)
      payments.push({
        method: secondaryMethod,
        amount: Number(secondaryAmount.toFixed(2)),
        ...(secondaryMethod === "CASH"
          ? { tenderedAmount: Number(secondaryAmount.toFixed(2)) }
          : {}),
      });
    onConfirm(payments);
  };
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="button-primary mt-5 w-full min-h-14 text-base"
        >
          Cobrar {money.format(total)}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60 data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-semibold">
                Cobrar venta
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Total {money.format(total)}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Cerrar">
              <X size={19} />
            </Dialog.Close>
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Medio principal</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {methods.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={method === id}
                  onClick={() => {
                    setMethod(id);
                    setCash(total);
                  }}
                  className={`min-h-20 rounded-xl border p-2 text-sm font-semibold ${method === id ? "brand-choice-active" : "border-slate-200"}`}
                >
                  <Icon className="mx-auto mb-1" size={20} />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {method === "CASH" ? (
            <label className="mt-5 grid gap-2 text-sm font-semibold">
              Efectivo recibido
              <input
                className="form-input text-lg"
                type="number"
                min={primaryAmount}
                step="0.01"
                value={cash}
                onChange={(event) => setCash(Number(event.target.value))}
              />
              <span className="font-normal text-slate-500">
                Vuelto: {money.format(Math.max(0, cash - primaryAmount))}
              </span>
            </label>
          ) : null}
          <fieldset className="mt-5 border-t border-slate-200 pt-5">
            <legend className="text-sm font-semibold">
              Pago combinado opcional
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <select
                className="form-input"
                value={secondaryMethod}
                onChange={(event) =>
                  setSecondaryMethod(event.target.value as PaymentMethod | "")
                }
              >
                <option value="">Sin segundo medio</option>
                {methods
                  .filter((item) => item.id !== method)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </select>
              <input
                className="form-input"
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={secondaryAmount}
                onChange={(event) =>
                  setSecondaryAmount(
                    Math.min(total, Number(event.target.value)),
                  )
                }
                disabled={!secondaryMethod}
              />
            </div>
          </fieldset>
          <Dialog.Close asChild>
            <button
              type="button"
              onClick={confirm}
              disabled={method === "CASH" && cash < primaryAmount}
              className="button-primary mt-7 w-full min-h-14"
            >
              Confirmar cobro
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CloseShiftDialog({
  shift,
  pending,
  error,
  onClose,
}: {
  shift: {
    expectedCash: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
  };
  pending: boolean;
  error?: string;
  onClose: (countedCash: number) => Promise<unknown>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [countedCash, setCountedCash] = useState(shift.expectedCash);
  const difference = countedCash - shift.expectedCash;
  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (open) setCountedCash(shift.expectedCash);
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" className="button-secondary">
          <LogOut size={18} /> Cerrar turno
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-semibold">
                Cerrar turno
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Ingresá el efectivo contado en la caja.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Cerrar">
              <X size={19} />
            </Dialog.Close>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <ShiftSummary
              label="Efectivo esperado"
              value={shift.expectedCash}
            />
            <ShiftSummary label="Ventas en efectivo" value={shift.cashSales} />
            <ShiftSummary label="Tarjetas" value={shift.cardSales} />
            <ShiftSummary label="Transferencias" value={shift.transferSales} />
          </dl>
          <label className="mt-5 grid gap-2 text-sm font-semibold">
            Efectivo contado
            <input
              className="form-input text-lg"
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(event) => setCountedCash(Number(event.target.value))}
            />
          </label>
          <p
            className={`mt-3 text-sm font-semibold ${difference === 0 ? "text-emerald-700" : "text-amber-700"}`}
          >
            Diferencia: {money.format(difference)}
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="button-primary mt-6 w-full"
            disabled={pending || countedCash < 0}
            onClick={() =>
              void onClose(countedCash)
                .then(() => setDialogOpen(false))
                .catch(() => undefined)
            }
          >
            {pending ? "Cerrando…" : "Confirmar cierre"}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShiftSummary({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{money.format(value)}</dd>
    </div>
  );
}
