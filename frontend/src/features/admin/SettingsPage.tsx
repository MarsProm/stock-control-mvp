import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ImageUp, Palette, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { errorMessage } from "../../lib/api";
import type { Me } from "../auth/types";
import { AccessibleColorPicker } from "./AccessibleColorPicker";
import { normalizeBrandColor } from "./brand-colors";
import {
  getSettings,
  updateSettings,
  uploadLogo,
  type BusinessSettings,
} from "./identity-api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [form, setForm] =
    useState<Omit<BusinessSettings, "id" | "slug" | "logoUrl">>();
  useEffect(() => {
    if (settings.data) {
      const { id: _id, slug: _slug, logoUrl: _logo, ...values } = settings.data;
      const brandColor = normalizeBrandColor(values.primaryColor);
      setForm({
        ...values,
        primaryColor: brandColor,
        accentColor: brandColor,
      });
    }
  }, [settings.data]);
  const save = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updatedSettings) =>
      syncBusinessSettings(queryClient, updatedSettings),
  });
  const logo = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (updatedSettings) =>
      syncBusinessSettings(queryClient, updatedSettings),
  });
  if (!form) return <div className="panel h-64 animate-pulse" />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({
      ...form,
      accentColor: form.primaryColor,
    });
  };
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Identidad</p>
          <h1 className="page-title">Configuración</h1>
          <p className="page-description">
            Personalizá la marca y elegí qué módulos utiliza la tienda.
          </p>
        </div>
      </header>
      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <section className="panel p-5 sm:p-7">
          <h2 className="flex items-center gap-2 font-semibold">
            <Palette size={19} /> Marca y ticket
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Nombre comercial">
              <input
                className="form-input"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <AccessibleColorPicker
                label="Color de marca"
                name="brand-color"
                value={form.primaryColor}
                onChange={(brandColor) =>
                  setForm({
                    ...form,
                    primaryColor: brandColor,
                    accentColor: brandColor,
                  })
                }
              />
            </div>
            <Field label="Encabezado del ticket">
              <input
                className="form-input"
                value={form.receiptHeader ?? ""}
                onChange={(event) =>
                  setForm({ ...form, receiptHeader: event.target.value })
                }
              />
            </Field>
            <Field label="Pie del ticket">
              <input
                className="form-input"
                value={form.receiptFooter ?? ""}
                onChange={(event) =>
                  setForm({ ...form, receiptFooter: event.target.value })
                }
              />
            </Field>
          </div>
          <fieldset className="mt-7 border-t border-slate-200 pt-6">
            <legend className="font-semibold">Módulos visibles</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Toggle
                checked={form.inventoryEnabled}
                label="Inventario"
                onChange={(checked) =>
                  setForm({ ...form, inventoryEnabled: checked })
                }
              />
              <Toggle
                checked={form.posEnabled}
                label="Caja"
                onChange={(checked) =>
                  setForm({ ...form, posEnabled: checked })
                }
              />
              <Toggle
                checked={form.reportsEnabled}
                label="Reportes"
                onChange={(checked) =>
                  setForm({ ...form, reportsEnabled: checked })
                }
              />
            </div>
          </fieldset>
          {save.isError ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage(save.error)}
            </p>
          ) : null}
          {save.isSuccess ? (
            <p
              role="status"
              className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              Configuración guardada.
            </p>
          ) : null}
          <button className="button-primary mt-6">
            <Save size={18} /> Guardar cambios
          </button>
        </section>
        <aside className="panel p-5">
          <h2 className="font-semibold">Logo</h2>
          <div className="mt-5 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-slate-100">
            {settings.data?.logoUrl ? (
              <img
                src={settings.data.logoUrl}
                alt="Logo actual"
                className="size-full object-contain p-6"
              />
            ) : (
              <ImageUp className="text-slate-400" size={48} />
            )}
          </div>
          <label className="button-secondary mt-4 w-full">
            {logo.isPending ? "Subiendo…" : "Subir logo"}
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) logo.mutate(file);
              }}
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            PNG, JPEG o WebP. Máximo 2 MB.
          </p>
          {logo.isError ? (
            <p className="mt-3 text-sm text-red-700">
              {errorMessage(logo.error)}
            </p>
          ) : null}
        </aside>
      </form>
    </>
  );
}

function syncBusinessSettings(
  queryClient: QueryClient,
  settings: BusinessSettings,
) {
  queryClient.setQueryData(["settings"], settings);
  queryClient.setQueryData<Me>(["me"], (current) =>
    current
      ? {
          ...current,
          businesses: current.businesses.map((business) =>
            business.id === settings.id
              ? {
                  ...business,
                  name: settings.name,
                  slug: settings.slug,
                  logoUrl: settings.logoUrl,
                  primaryColor: settings.primaryColor,
                  accentColor: settings.accentColor,
                  inventoryEnabled: settings.inventoryEnabled,
                  posEnabled: settings.posEnabled,
                  reportsEnabled: settings.reportsEnabled,
                }
              : business,
          ),
        }
      : current,
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
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="brand-checkbox size-5"
      />
      {label}
    </label>
  );
}
