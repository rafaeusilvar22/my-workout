ALTER TABLE training_splits ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
