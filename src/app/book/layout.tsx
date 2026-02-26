/** Book layout: /book is public, /book/pdf is gated per-page */
export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
