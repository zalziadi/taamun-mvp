-- customer_subscriptions: ربط المستخدم باشتراك Stripe
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text        NOT NULL,
  stripe_subscription_id   text        UNIQUE,
  stripe_price_id          text,
  status                   text        NOT NULL DEFAULT 'inactive',
  tier                     text,
  current_period_end       timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cs_user_id_idx       ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS cs_customer_id_idx   ON customer_subscriptions(stripe_customer_id);

ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- المستخدم يقرأ اشتراكه فقط
CREATE POLICY "users_read_own_subscription"
  ON customer_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
