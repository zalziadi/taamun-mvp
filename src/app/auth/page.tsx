import { AuthClient } from "./AuthClient";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      <AuthClient />
    </div>
  );
}
