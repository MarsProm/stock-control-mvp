import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccessibleColorPicker } from "./AccessibleColorPicker";
import { BRAND_COLORS, contrastWithWhite } from "./brand-colors";

describe("AccessibleColorPicker", () => {
  it("offers only colors with WCAG AA contrast for white text", () => {
    for (const color of BRAND_COLORS) {
      expect(contrastWithWhite(color.value)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("reports the selected color", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AccessibleColorPicker
        label="Color principal"
        name="primary-color"
        value="#334155"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Azul/ }));

    expect(onChange).toHaveBeenCalledWith("#1D4ED8");
  });
});
