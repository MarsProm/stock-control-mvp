import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Product, ProductInput } from "./types";

const productSchema = z.object({
  code: z.string().trim().min(3, "Usa al menos 3 caracteres").max(50),
  name: z.string().trim().min(2, "Usa al menos 2 caracteres").max(150),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "El precio no puede ser negativo"),
  minimumStock: z.number().int().min(0, "El minimo no puede ser negativo"),
  initialStock: z
    .number()
    .int()
    .min(0, "El stock inicial no puede ser negativo"),
});

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  product?: Product | null;
  initialCode?: string;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ProductInput) => Promise<void>;
};

function defaults(
  product?: Product | null,
  initialCode?: string,
): ProductFormValues {
  return {
    code: product?.code ?? initialCode ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    minimumStock: product?.minimumStock ?? 0,
    initialStock: 0,
  };
}

export function ProductForm({
  product,
  initialCode,
  error,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults(product, initialCode),
  });

  useEffect(() => {
    reset(defaults(product, initialCode));
  }, [initialCode, product, reset]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Catalogo
            </p>
            <h2
              id="product-form-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {product ? "Editar producto" : "Nuevo producto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600"
            aria-label="Cerrar formulario"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 sm:grid-cols-2"
        >
          <Field label="Codigo" error={errors.code?.message}>
            <input
              {...register("code")}
              className="form-input uppercase read-only:bg-slate-100 read-only:text-slate-600"
              placeholder="7791234567890"
              readOnly={Boolean(initialCode) && !product}
              aria-invalid={Boolean(errors.code)}
            />
          </Field>
          <Field label="Nombre" error={errors.name?.message}>
            <input
              {...register("name")}
              className="form-input"
              placeholder="Cafe molido 500 g"
            />
          </Field>
          <Field label="Precio" error={errors.price?.message}>
            <input
              {...register("price", { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="form-input"
            />
          </Field>
          <Field label="Stock minimo" error={errors.minimumStock?.message}>
            <input
              {...register("minimumStock", { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              className="form-input"
            />
          </Field>
          {!product ? (
            <Field label="Stock inicial" error={errors.initialStock?.message}>
              <input
                {...register("initialStock", { valueAsNumber: true })}
                type="number"
                min="0"
                step="1"
                className="form-input"
                aria-invalid={Boolean(errors.initialStock)}
              />
            </Field>
          ) : null}
          <div className="sm:col-span-2">
            <Field label="Descripcion" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={3}
                className="form-input resize-y"
                placeholder="Detalle opcional del producto"
              />
            </Field>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button-primary"
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                  size={18}
                />
              ) : null}
              {product ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span className="text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
