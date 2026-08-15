import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  PackageCheck,
  PackageX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { errorMessage } from "../../lib/api";
import { useBusiness } from "../auth/business-context";
import { listProducts } from "../products/product-api";

export function DashboardPage() {
  const { business } = useBusiness();
  const totals = useQuery({
    queryKey: ["products", "dashboard-total", business?.id],
    queryFn: () => listProducts({ size: 1 }),
    enabled: Boolean(business),
  });
  const lowStock = useQuery({
    queryKey: ["products", "dashboard-low-stock", business?.id],
    queryFn: () =>
      listProducts({ lowStock: true, size: 100, sort: "name,asc" }),
    enabled: Boolean(business),
  });

  const outOfStock =
    lowStock.data?.content.filter((product) => product.currentStock === 0)
      .length ?? 0;
  const lowCount = lowStock.data?.page.totalElements ?? 0;

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-2">
          Resumen operativo
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard de inventario
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Una vista rapida de las existencias y los productos que requieren
          atencion.
        </p>
      </header>

      {totals.isError || lowStock.isError ? (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage(totals.error ?? lowStock.error)}
        </div>
      ) : null}

      <section
        aria-label="Indicadores de inventario"
        className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Productos activos"
          value={totals.data?.page.totalElements}
          icon={Boxes}
          tone="slate"
          loading={totals.isPending}
        />
        <MetricCard
          label="Stock saludable"
          value={Math.max(0, (totals.data?.page.totalElements ?? 0) - lowCount)}
          icon={PackageCheck}
          tone="green"
          loading={totals.isPending || lowStock.isPending}
        />
        <MetricCard
          label="Stock bajo"
          value={lowCount}
          icon={AlertTriangle}
          tone="amber"
          loading={lowStock.isPending}
        />
        <MetricCard
          label="Sin existencias"
          value={outOfStock}
          icon={PackageX}
          tone="red"
          loading={lowStock.isPending}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold">Reposicion prioritaria</h2>
            <p className="mt-1 text-sm text-slate-500">
              Productos en su minimo o por debajo.
            </p>
          </div>
          <Link
            to="/products"
            className="brand-link"
          >
            Ver catalogo <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        {lowStock.isPending ? (
          <div
            className="space-y-3 p-5"
            aria-label="Cargando productos con stock bajo"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : null}

        {lowStock.data?.content.length === 0 ? (
          <div className="grid place-items-center px-6 py-14 text-center">
            <PackageCheck
              className="mb-4 text-emerald-600"
              aria-hidden="true"
              size={38}
            />
            <h3 className="font-semibold">Todo esta bajo control</h3>
            <p className="mt-1 text-sm text-slate-500">
              No hay productos pendientes de reposicion.
            </p>
          </div>
        ) : null}

        <div className="divide-y divide-slate-100">
          {lowStock.data?.content.slice(0, 8).map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{product.code}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {product.currentStock} unidades
                  </p>
                  <p className="text-xs text-slate-500">
                    Minimo {product.minimumStock}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.currentStock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                >
                  {product.currentStock === 0 ? "Agotado" : "Reponer"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

type MetricTone = "slate" | "green" | "amber" | "red";

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value?: number;
  icon: typeof Boxes;
  tone: MetricTone;
  loading: boolean;
}) {
  const tones: Record<MetricTone, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <span
          className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}
        >
          <Icon aria-hidden="true" size={21} />
        </span>
      </div>
      {loading ? (
        <div className="mb-2 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="text-3xl font-semibold tracking-tight">{value ?? 0}</p>
      )}
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </article>
  );
}
