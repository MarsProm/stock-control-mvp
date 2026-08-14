CREATE TABLE businesses (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    logo_url VARCHAR(600),
    primary_color VARCHAR(7) NOT NULL DEFAULT '#334155',
    accent_color VARCHAR(7) NOT NULL DEFAULT '#047857',
    receipt_header VARCHAR(250),
    receipt_footer VARCHAR(250),
    inventory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pos_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reports_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_businesses_primary_color CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT ck_businesses_accent_color CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX ux_businesses_slug_lower ON businesses (LOWER(slug));

INSERT INTO businesses (
    id, name, slug, active, primary_color, accent_color,
    inventory_enabled, pos_enabled, reports_enabled, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000100', 'Tienda inicial', 'tienda-inicial', TRUE,
    '#334155', '#047857', TRUE, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN business_id UUID;
UPDATE products SET business_id = '00000000-0000-0000-0000-000000000100';
ALTER TABLE products ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES businesses(id);
DROP INDEX ux_products_code_upper;
CREATE UNIQUE INDEX ux_products_business_code_upper ON products (business_id, UPPER(code));
CREATE INDEX ix_products_business_active ON products (business_id, active);

ALTER TABLE stock_movements ADD COLUMN business_id UUID;
UPDATE stock_movements movement
SET business_id = product.business_id
FROM products product
WHERE product.id = movement.product_id;
ALTER TABLE stock_movements ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_business FOREIGN KEY (business_id) REFERENCES businesses(id);
ALTER TABLE stock_movements ADD COLUMN actor_user_id UUID;

CREATE TABLE platform_administrators (
    auth_user_id UUID PRIMARY KEY,
    email VARCHAR(320),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE business_memberships (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    auth_user_id UUID NOT NULL,
    email VARCHAR(320) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (max_discount_percent >= 0 AND max_discount_percent <= 100),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ux_business_memberships_user UNIQUE (business_id, auth_user_id)
);

CREATE INDEX ix_business_memberships_auth_user ON business_memberships (auth_user_id, active);

CREATE TABLE business_invitations (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    email VARCHAR(320) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
    max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (max_discount_percent >= 0 AND max_discount_percent <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED')),
    invited_by UUID NOT NULL,
    accepted_by UUID,
    created_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_business_invitations_pending
    ON business_invitations (business_id, LOWER(email)) WHERE status = 'PENDING';

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ux_cash_registers_name UNIQUE (business_id, name)
);

CREATE TABLE cash_shifts (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    cashier_user_id UUID NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    opening_cash NUMERIC(19, 2) NOT NULL CHECK (opening_cash >= 0),
    expected_cash NUMERIC(19, 2) NOT NULL CHECK (expected_cash >= 0),
    counted_cash NUMERIC(19, 2),
    difference NUMERIC(19, 2),
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX ux_cash_shifts_open_register ON cash_shifts (register_id) WHERE status = 'OPEN';
CREATE UNIQUE INDEX ux_cash_shifts_open_cashier ON cash_shifts (business_id, cashier_user_id) WHERE status = 'OPEN';
CREATE INDEX ix_cash_shifts_business_opened ON cash_shifts (business_id, opened_at DESC);

CREATE TABLE business_counters (
    business_id UUID PRIMARY KEY REFERENCES businesses(id),
    next_sale_number BIGINT NOT NULL DEFAULT 1 CHECK (next_sale_number > 0)
);

INSERT INTO business_counters (business_id, next_sale_number)
SELECT id, 1 FROM businesses;

CREATE TABLE sales (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id),
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    shift_id UUID NOT NULL REFERENCES cash_shifts(id),
    cashier_user_id UUID NOT NULL,
    sale_number BIGINT NOT NULL CHECK (sale_number > 0),
    status VARCHAR(12) NOT NULL CHECK (status IN ('COMPLETED', 'CANCELLED')),
    subtotal NUMERIC(19, 2) NOT NULL CHECK (subtotal >= 0),
    discount_total NUMERIC(19, 2) NOT NULL CHECK (discount_total >= 0),
    total NUMERIC(19, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason VARCHAR(255),
    CONSTRAINT ux_sales_number UNIQUE (business_id, sale_number)
);

CREATE INDEX ix_sales_business_created ON sales (business_id, created_at DESC);
CREATE INDEX ix_sales_shift_created ON sales (shift_id, created_at DESC);

CREATE TABLE receipt_snapshots (
    sale_id UUID PRIMARY KEY REFERENCES sales(id),
    business_name VARCHAR(150) NOT NULL,
    logo_url VARCHAR(600),
    primary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    receipt_header VARCHAR(250),
    receipt_footer VARCHAR(250),
    CONSTRAINT ck_receipt_snapshots_primary_color CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT ck_receipt_snapshots_accent_color CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(19, 2) NOT NULL CHECK (unit_price >= 0),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    discount_percent NUMERIC(5, 2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_reason VARCHAR(255),
    line_subtotal NUMERIC(19, 2) NOT NULL CHECK (line_subtotal >= 0),
    line_total NUMERIC(19, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE sale_payments (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id),
    method VARCHAR(12) NOT NULL CHECK (method IN ('CASH', 'CARD', 'TRANSFER')),
    amount NUMERIC(19, 2) NOT NULL CHECK (amount > 0),
    tendered_amount NUMERIC(19, 2),
    change_amount NUMERIC(19, 2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
    reference VARCHAR(120)
);

ALTER TABLE stock_movements ADD COLUMN sale_id UUID REFERENCES sales(id);
CREATE INDEX ix_stock_movements_business_created ON stock_movements (business_id, created_at DESC);
CREATE INDEX ix_stock_movements_sale ON stock_movements (sale_id) WHERE sale_id IS NOT NULL;

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE businesses, products, stock_movements, platform_administrators,
            business_memberships, business_invitations, cash_registers, cash_shifts,
            business_counters, sales, sale_items, sale_payments, receipt_snapshots FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE businesses, products, stock_movements, platform_administrators,
            business_memberships, business_invitations, cash_registers, cash_shifts,
            business_counters, sales, sale_items, sale_payments, receipt_snapshots FROM authenticated;
    END IF;
END $$;
