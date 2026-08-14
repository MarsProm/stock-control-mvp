import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductForm } from "./ProductForm";

describe("ProductForm", () => {
  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm onCancel={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(
      await screen.findByText("Usa al menos 3 caracteres"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid product", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm onCancel={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Codigo"), "CAF-001");
    await user.type(screen.getByLabelText("Nombre"), "Cafe molido");
    await user.clear(screen.getByLabelText("Precio"));
    await user.type(screen.getByLabelText("Precio"), "8500");
    await user.clear(screen.getByLabelText("Stock minimo"));
    await user.type(screen.getByLabelText("Stock minimo"), "5");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "CAF-001",
        name: "Cafe molido",
        price: 8500,
        minimumStock: 5,
      }),
      expect.anything(),
    );
  });

  it("keeps a scanned code and submits the initial stock", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        initialCode="7791234567890"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const codeInput = screen.getByLabelText("Codigo");
    expect(codeInput).toHaveValue("7791234567890");
    expect(codeInput).toHaveAttribute("readonly");

    await user.type(screen.getByLabelText("Nombre"), "Cafe molido");
    await user.clear(screen.getByLabelText("Precio"));
    await user.type(screen.getByLabelText("Precio"), "8500");
    await user.clear(screen.getByLabelText("Stock inicial"));
    await user.type(screen.getByLabelText("Stock inicial"), "12");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "7791234567890",
        name: "Cafe molido",
        initialStock: 12,
      }),
      expect.anything(),
    );
  });
});
