-- إضافة دعم Tap للجدول الموجود

ALTER TABLE customer_subscriptions
  ADD COLUMN IF NOT EXISTS tap_charge_id text;

CREATE INDEX IF NOT EXISTS cs_tap_charge_id_idx
  ON customer_subscriptions(tap_charge_id);

-- قيد فريد على user_id لدعم upsert
ALTER TABLE customer_subscriptions
  ADD CONSTRAINT IF NOT EXISTS customer_subscriptions_user_id_unique UNIQUE (user_id);
