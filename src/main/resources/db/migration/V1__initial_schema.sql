CREATE TABLE products (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    price NUMERIC(19, 2) NOT NULL CHECK (price >= 0),
    current_stock BIGINT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock BIGINT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_products_code_upper ON products (UPPER(code));
CREATE INDEX ix_products_name_lower ON products (LOWER(name));
CREATE INDEX ix_products_active ON products (active);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('ENTRY', 'EXIT')),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    reason VARCHAR(255) NOT NULL,
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_stock_movements_product_created
    ON stock_movements (product_id, created_at DESC, id DESC);
