-- إضافة حقول المسبحة إلى جدول profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tasbeeh_access BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tasbeeh_activated_at TIMESTAMPTZ;

-- إضافة حقل product إلى جدول activation_codes لتحديد نوع المنتج
ALTER TABLE activation_codes
  ADD COLUMN IF NOT EXISTS product TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.tasbeeh_access IS 'وصول المسبحة — 28 ريال أو مجاني مع الباقة السنوية';
COMMENT ON COLUMN activation_codes.product IS 'نوع المنتج: null=اشتراك عام, tasbeeh=مسبحة فقط';
