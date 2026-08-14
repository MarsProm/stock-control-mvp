import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccessibleColorPicker } from "./AccessibleColorPicker";
import {
  BRAND_COLORS,
  contrastWithWhite,
  normalizeBrandColor,
} from "./brand-colors";

describe("AccessibleColorPicker", () => {
  it("offers the five curated brand colors", () => {
    expect(BRAND_COLORS.map((color) => color.value)).toEqual([
      "#1D4ED8",
      "#047857",
      "#4338CA",
      "#B91C1C",
      "#334155",
    ]);
  });

  it("offers only colors with WCAG AA contrast for white text", () => {
    for (const color of BRAND_COLORS) {
      expect(contrastWithWhite(color.value)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("normalizes legacy colors to the neutral default", () => {
    expect(normalizeBrandColor("#6D28D9")).toBe("#334155");
    expect(normalizeBrandColor("#047857")).toBe("#047857");
  });

  it("reports the selected color", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AccessibleColorPicker
        label="Color de marca"
        name="brand-color"
        value="#334155"
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("radio", { name: /Azul profesional/ }),
    );

    expect(onChange).toHaveBeenCalledWith("#1D4ED8");
  });
});
