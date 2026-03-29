import { redirect } from "next/navigation";

export default function AuthPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next || "";
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
}
