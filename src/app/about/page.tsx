import { Card } from "@/components/ui";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <Card className="p-6">
        <div className="space-y-4">
          <h1 className="h1">عن البرنامج</h1>
          <p className="p-muted">صفحة عن البرنامج ستُضاف لاحقًا.</p>
          <Link href="/">
            <span className="text-gold hover:underline">← العودة للرئيسية</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
