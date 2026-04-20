import type { Metadata } from "next";

/**
 * /year-in-review layout — RTL wrapper + private-retrospective metadata.
 *
 * Plan 11.04. The route is a user-specific retrospective behind auth, so
 * `robots: { index: false, follow: false }` keeps it out of crawler indexes
 * (NFR-03 applies to public routes; this route is explicitly private).
 *
 * Arabic title "سنتي مع القرآن" per YIR-09 reflective-tone requirement — also
 * the header used by the share card (Plan 11.06).
 *
 * `dir="rtl"` is inherited from the root <html> tag but reinforced here so
 * the segment never accidentally flips LTR if the root changes.
 */
export const metadata: Metadata = {
  title: "سنتي مع القرآن — تمعّن",
  description:
    "حصيلتك السنوية من التمعّن — أرقام ومحطات، دون كشف أي تأمّل شخصي.",
  robots: { index: false, follow: false },
};

export default function YearInReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className="min-h-screen">
      {children}
    </div>
  );
}
