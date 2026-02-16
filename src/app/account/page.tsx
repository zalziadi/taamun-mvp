import { AppShell } from "../../components/AppShell";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <AppShell title="حسابي">
      <AccountClient embedded />
    </AppShell>
  );
}
