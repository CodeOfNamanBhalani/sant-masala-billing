-- Sant Masala Performance Indexes
-- Run once on your Supabase/PostgreSQL console (SQL Editor tab)
-- These make product lookups and joins significantly faster.

CREATE INDEX IF NOT EXISTS idx_product_active    ON product(is_active);
CREATE INDEX IF NOT EXISTS idx_product_category  ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_name      ON product(name_en);
CREATE INDEX IF NOT EXISTS idx_product_price_pid ON product_price(product_id);
