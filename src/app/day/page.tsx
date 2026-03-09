import { AppShell } from "@/components/AppShell";
import { DayExperience } from "@/components/DayExperience";

export const dynamic = "force-dynamic";

export default function DayPage() {
  return (
    <AppShell>
      <DayExperience day={1} />
    </AppShell>
  );
}
