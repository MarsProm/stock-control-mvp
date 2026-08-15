import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowDownUp,
  Boxes,
  Pencil,
  Plus,
  ScanBarcode,
  Search,
} from "lucide-react";
import { lazy, Suspense, useDeferredValue, useState } from "react";
import { errorMessage } from "../../lib/api";
import { useBusiness } from "../auth/business-context";
import { MovementForm } from "../movements/MovementForm";
import { ProductForm } from "./ProductForm";
import {
  createMovement,
  createProduct,
  deactivateProduct,
  listProducts,
  updateProduct,
} from "./product-api";
import type { MovementInput, Product, ProductInput } from "./types";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const BarcodeScannerWorkflow = lazy(() =>
  import("./BarcodeScannerWorkflow").then((module) => ({
    default: module.BarcodeScannerWorkflow,
  })),
);

export function ProductsPage() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const products = useQuery({
    queryKey: ["products", business?.id, deferredSearch],
    queryFn: () => listProducts({ query: deferredSearch, size: 50 }),
    enabled: Boolean(business),
  });

  const saveProduct = useMutation({
    mutationFn: ({
      product,
      values,
    }: {
      product: Product | null;
      values: ProductInput;
    }) => (product ? updateProduct(product.id, values) : createProduct(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      setEditingProduct(null);
    },
  });

  const deactivate = useMutation({
    mutationFn: deactivateProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const movement = useMutation({
    mutationFn: ({
      productId,
      values,
    }: {
      productId: string;
      values: MovementInput;
    }) => createMovement(productId, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["movements"] }),
      ]);
      setMovementProduct(null);
    },
  });

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  return (
    <>
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Catalogo</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Productos
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Administra articulos, niveles minimos y movimientos de inventario.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="button-secondary"
          >
            <ScanBarcode aria-hidden="true" size={19} /> Escanear codigo
          </button>
          <button type="button" onClick={openCreate} className="button-primary">
            <Plus aria-hidden="true" size={19} /> Nuevo producto
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
              size={18}
            />
            <span className="sr-only">Buscar por codigo o nombre</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input pl-10"
              placeholder="Buscar por codigo o nombre"
            />
          </label>
          <p className="text-sm text-slate-500">
            {products.data
              ? `${products.data.page.totalElements} productos`
              : "Consultando catalogo"}
          </p>
        </div>

        {products.isPending ? <ProductsSkeleton /> : null}
        {products.isError ? (
          <div
            role="alert"
            className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {errorMessage(products.error)}
          </div>
        ) : null}
        {products.data?.content.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Boxes aria-hidden="true" />
            </span>
            <h2 className="font-semibold">No encontramos productos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Prueba otra busqueda o crea el primer producto.
            </p>
          </div>
        ) : null}

        {products.data && products.data.content.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Producto</th>
                    <th className="px-5 py-3 font-semibold">Precio</th>
                    <th className="px-5 py-3 font-semibold">Existencia</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.data.content.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {product.code}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {money.format(product.price)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{product.currentStock}</p>
                        <p className="text-xs text-slate-500">
                          Minimo {product.minimumStock}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge product={product} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label="Movimiento"
                            onClick={() => setMovementProduct(product)}
                            icon={ArrowDownUp}
                          />
                          <ActionButton
                            label="Editar"
                            onClick={() => openEdit(product)}
                            icon={Pencil}
                          />
                          <ActionButton
                            label="Desactivar"
                            onClick={() => deactivate.mutate(product.id)}
                            icon={Archive}
                            disabled={deactivate.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {products.data.content.map((product) => (
                <article key={product.id} className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{product.name}</h2>
                      <p className="text-xs text-slate-500">{product.code}</p>
                    </div>
                    <StockBadge product={product} />
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Precio</p>
                      <p className="mt-1 font-semibold">
                        {money.format(product.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Stock</p>
                      <p className="mt-1 font-semibold">
                        {product.currentStock}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Minimo</p>
                      <p className="mt-1 font-semibold">
                        {product.minimumStock}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MobileAction
                      label="Mover"
                      onClick={() => setMovementProduct(product)}
                      icon={ArrowDownUp}
                    />
                    <MobileAction
                      label="Editar"
                      onClick={() => openEdit(product)}
                      icon={Pencil}
                    />
                    <MobileAction
                      label="Archivar"
                      onClick={() => deactivate.mutate(product.id)}
                      icon={Archive}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {showForm ? (
        <ProductForm
          product={editingProduct}
          error={
            saveProduct.isError ? errorMessage(saveProduct.error) : undefined
          }
          onCancel={() => setShowForm(false)}
          onSubmit={async (values) => {
            await saveProduct.mutateAsync({ product: editingProduct, values });
          }}
        />
      ) : null}

      {movementProduct ? (
        <MovementForm
          product={movementProduct}
          error={movement.isError ? errorMessage(movement.error) : undefined}
          onCancel={() => setMovementProduct(null)}
          onSubmit={async (values: MovementInput) => {
            await movement.mutateAsync({
              productId: movementProduct.id,
              values,
            });
          }}
        />
      ) : null}

      {scannerOpen ? (
        <Suspense fallback={<ScannerLoading />}>
          <BarcodeScannerWorkflow onClose={() => setScannerOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}

function ScannerLoading() {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-6"
      role="status"
    >
      <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-2xl">
        Preparando el lector de codigos...
      </div>
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const styles =
    product.currentStock === 0
      ? "bg-red-100 text-red-700"
      : product.lowStock
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-700";
  const label =
    product.currentStock === 0
      ? "Sin stock"
      : product.lowStock
        ? "Stock bajo"
        : "Disponible";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  icon: Icon,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Pencil;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="icon-button"
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" size={17} />
    </button>
  );
}

function MobileAction({
  label,
  onClick,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Pencil;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
    >
      <Icon aria-hidden="true" size={16} /> {label}
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-label="Cargando productos">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-14 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}
