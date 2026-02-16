import { AppShell } from "../../components/AppShell";
import { AuthClient } from "./AuthClient";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <AppShell title="الدخول">
      <AuthClient embedded />
    </AppShell>
  );
}
