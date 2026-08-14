export type Register = { id: string; name: string; active: boolean };

export type Shift = {
  id: string;
  registerId: string;
  registerName: string;
  cashierUserId: string;
  status: "OPEN" | "CLOSED";
  openingCash: number;
  expectedCash: number;
  countedCash: number | null;
  difference: number | null;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  openedAt: string;
  closedAt: string | null;
};

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export type SaleItem = {
  id: string;
  productId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  discountReason: string | null;
  subtotal: number;
  total: number;
};

export type SalePayment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  tenderedAmount: number | null;
  changeAmount: number;
  reference: string | null;
};

export type Sale = {
  id: string;
  number: string;
  status: "COMPLETED" | "CANCELLED";
  registerId: string;
  registerName: string;
  shiftId: string;
  cashierUserId: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
};
