import { Check } from "lucide-react";
import { BRAND_COLORS, contrastWithWhite } from "./brand-colors";

type AccessibleColorPickerProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
};

export function AccessibleColorPicker({
  label,
  name,
  value,
  onChange,
}: AccessibleColorPickerProps) {
  const selected =
    BRAND_COLORS.find((color) => color.value === value.toUpperCase()) ??
    BRAND_COLORS[0];
  const descriptionId = `${name}-color-description`;

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">
        {label}
      </legend>
      <div className="mt-2 grid grid-cols-7 gap-2 sm:grid-cols-9 lg:grid-cols-7">
        {BRAND_COLORS.map((color) => {
          const checked = color.value === value.toUpperCase();
          return (
            <label
              key={color.value}
              className="relative grid min-h-11 min-w-11 place-items-center"
              title={`${color.name} ${color.value}`}
            >
              <input
                type="radio"
                name={name}
                value={color.value}
                checked={checked}
                onChange={() => onChange(color.value)}
                aria-describedby={descriptionId}
                className="peer sr-only"
              />
              <span
                className="grid size-11 place-items-center rounded-xl border-2 border-white text-white shadow-sm ring-1 ring-slate-300 transition peer-checked:ring-2 peer-checked:ring-slate-950 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-950"
                style={{ backgroundColor: color.value }}
                aria-hidden="true"
              >
                {checked ? <Check size={19} strokeWidth={3} /> : null}
              </span>
              <span className="sr-only">
                {color.name}, {color.value}
              </span>
            </label>
          );
        })}
      </div>
      <div
        id={descriptionId}
        className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: selected.value }}
      >
        <span>{selected.name}</span>
        <span className="font-mono text-xs">
          {selected.value} · {contrastWithWhite(selected.value).toFixed(1)}:1
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Todos los colores permiten texto blanco con contraste WCAG AA.
      </p>
    </fieldset>
  );
}
