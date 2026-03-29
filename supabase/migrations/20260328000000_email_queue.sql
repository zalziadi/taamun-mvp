-- email_queue: جدولة إرسال الإيميلات بعد الدفع
-- يُضاف صف عند تأكيد الدفع، ويُرسل بعد 5 دقائق عبر Cron

CREATE TABLE IF NOT EXISTS email_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  template     TEXT NOT NULL DEFAULT 'activation',
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'sent', 'failed')),
  send_after   TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للـ Cron: الإيميلات المستحقة للإرسال
CREATE INDEX idx_email_queue_pending
  ON email_queue (send_after)
  WHERE status = 'pending';

-- RLS: الجدول للخادم فقط (service_role)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
-- لا سياسات = لا وصول من العميل
