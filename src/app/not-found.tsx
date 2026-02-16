import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[760px]">
      <Card className="space-y-4 p-6">
        <h1 className="h1">الصفحة غير موجودة</h1>
        <p className="p-muted">الرابط غير صحيح أو تم نقله.</p>
        <Link href="/" className="inline-flex">
          <Button size="lg">العودة للرئيسية</Button>
        </Link>
      </Card>
    </div>
  );
}
