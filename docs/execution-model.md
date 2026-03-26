# System Architecture — Taamun Execution Model

## Agent Team (الفريق)

| Agent | Role |
|-------|------|
| **Burhan** | Strategy · Architecture · Product direction |
| **Wolf** | Growth · Conversion · Marketing |
| **Musakhar** | Sales · Pricing · Offers |
| **CJ** | Technical execution · Code · Deployment |

## Layers

```
Agent Team (Direction)
    ↓
Claude (Reasoning Layer)
    ↓
Claude Code (Execution Layer)
    ↓
Sub-Agents (Task Units)
```

### Claude — Reasoning Layer
- يفكر، يحلل، يقترح
- لا ينفّذ مباشرة — يمرر التنفيذ لـ Claude Code

### Claude Code — Execution Layer
- ينفّذ التعديلات على الكود والملفات
- يلتزم بـ CLAUDE.md و MEMORY.md كقانون

## Sub-Agents (الوحدات التنفيذية)

| Sub-Agent | المسؤولية |
|-----------|----------|
| `conversion-fixer` | تحسين مسار التحويل (CTA، onboarding، friction points) |
| `payment-handler` | ربط وإصلاح بوابة الدفع (Tap/Stripe) |
| `delivery-engine` | تسليم المحتوى بعد الدفع (entitlement، access) |
| `supabase-maintainer` | صيانة القاعدة (migrations، RLS، indexes) |
| `debug-agent` | تشخيص وإصلاح الأخطاء (build، runtime، API) |

## قواعد التشغيل

| # | القاعدة |
|---|--------|
| 1 | المهام صغيرة — مسؤولية واحدة لكل sub-agent |
| 2 | لا يتجاوز sub-agent حدود مسؤوليته |
| 3 | كل تعديل يمر بـ tsc + build قبل الاعتماد |
| 4 | التركيز على التحويل: User → Payment → Delivery |
| 5 | لا refactors تخمينية — فقط ما يحرّك metric |

## Mission

> **Maximize conversion: User → Payment → Delivery**

كل قرار تقني أو تصميمي يُقاس بتأثيره على هذا المسار.

## Execution Flow

```
1. Agent Team يحدد المهمة
2. Claude يحلل ويخطط
3. Claude Code ينفّذ (ملف واحد أو اثنين في كل مرة)
4. Sub-Agent المناسب يتولى التخصص
5. تحقق (tsc + build)
6. Deploy عبر Vercel
```

---

**تاريخ التثبيت**: 2026-03-24
