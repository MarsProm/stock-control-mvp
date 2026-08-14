import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LoaderCircle,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { MovementInput, Product } from "../products/types";

const movementSchema = z.object({
  type: z.enum(["ENTRY", "EXIT"]),
  quantity: z.number().int().positive("La cantidad debe ser mayor que cero"),
  reason: z.string().trim().min(3, "Explica brevemente el motivo").max(255),
});

type MovementFormValues = z.infer<typeof movementSchema>;

type MovementFormProps = {
  product: Product;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: MovementInput) => Promise<void>;
};

export function MovementForm({
  product,
  error,
  onCancel,
  onSubmit,
}: MovementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: "ENTRY", quantity: 1, reason: "" },
  });
  const type = watch("type");

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-form-title"
        className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              {product.code}
            </p>
            <h2
              id="movement-form-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Movimiento de {product.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Existencia actual:{" "}
              <strong>{product.currentStock} unidades</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="icon-button"
            aria-label="Cerrar formulario"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Tipo de movimiento
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`movement-option ${type === "ENTRY" ? "movement-option-active" : ""}`}
              >
                <input
                  {...register("type")}
                  type="radio"
                  value="ENTRY"
                  className="sr-only"
                />
                <ArrowDownToLine aria-hidden="true" size={20} /> Entrada
              </label>
              <label
                className={`movement-option ${type === "EXIT" ? "movement-option-active" : ""}`}
              >
                <input
                  {...register("type")}
                  type="radio"
                  value="EXIT"
                  className="sr-only"
                />
                <ArrowUpFromLine aria-hidden="true" size={20} /> Salida
              </label>
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Cantidad
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min="1"
              step="1"
              className="form-input"
            />
            {errors.quantity ? (
              <span className="text-xs text-red-600">
                {errors.quantity.message}
              </span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Motivo
            <textarea
              {...register("reason")}
              rows={3}
              className="form-input"
              placeholder={
                type === "ENTRY"
                  ? "Compra o inventario inicial"
                  : "Venta, merma o ajuste"
              }
            />
            {errors.reason ? (
              <span className="text-xs text-red-600">
                {errors.reason.message}
              </span>
            ) : null}
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
              Confirmar {type === "ENTRY" ? "entrada" : "salida"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
