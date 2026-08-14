import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReceiptView } from "./ReceiptView";
import type { Sale } from "./types";

const sale: Sale = {
  id: "sale-1",
  number: "V-00000001",
  status: "COMPLETED",
  registerId: "register-1",
  registerName: "Caja 1",
  shiftId: "shift-1",
  cashierUserId: "user-1",
  subtotal: 1200,
  discountTotal: 0,
  total: 1200,
  businessName: "Almacén Central",
  logoUrl: null,
  primaryColor: "#334155",
  accentColor: "#047857",
  receiptHeader: "Venta interna",
  receiptFooter: "Gracias por tu compra",
  createdAt: "2026-08-13T20:00:00Z",
  cancelledAt: null,
  cancellationReason: null,
  items: [
    {
      id: "item-1",
      productId: "product-1",
      code: "7790001",
      name: "Café",
      unitPrice: 1200,
      quantity: 1,
      discountPercent: 0,
      discountReason: null,
      subtotal: 1200,
      total: 1200,
    },
  ],
  payments: [
    {
      id: "payment-1",
      method: "CASH",
      amount: 1200,
      tenderedAmount: 1500,
      changeAmount: 300,
      reference: null,
    },
  ],
};

describe("ReceiptView", () => {
  it("renders the immutable sale details and prints from the browser", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<ReceiptView sale={sale} />);

    expect(screen.getByText("Almacén Central")).toBeInTheDocument();
    expect(screen.getByText("V-00000001")).toBeInTheDocument();
    expect(
      screen.getByText("Comprobante interno — no válido como factura"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Imprimir ticket" }),
    );
    expect(print).toHaveBeenCalledOnce();
  });
});
