"use client";

type KahfiClientProps = {
  userEmail: string | null;
  userCreatedAt: string | null;
  userId: string;
};

function formatJoinDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function KahfiClient({ userEmail, userCreatedAt, userId }: KahfiClientProps) {
  return (
    <main dir="rtl" style={{ minHeight: "100vh", padding: "40px 20px", background: "#0B0F14", color: "#E8ECF3" }}>
      <section style={{ maxWidth: 760, margin: "0 auto", border: "1px solid #1D2530", borderRadius: 16, padding: 24, background: "#111824" }}>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.4 }}>كهفي</h1>
        <p style={{ marginTop: 10, color: "#9CB0C9" }}>
          أهلا بك في مساحتك الخاصة داخل تمعّن.
        </p>

        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <div><strong>البريد:</strong> {userEmail ?? "-"}</div>
          <div><strong>تاريخ الانضمام:</strong> {formatJoinDate(userCreatedAt)}</div>
          <div style={{ wordBreak: "break-all" }}><strong>المعرف:</strong> {userId}</div>
        </div>
      </section>
    </main>
  );
}
