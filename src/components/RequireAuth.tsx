"use client";
interface RequireAuthProps { children: React.ReactNode; next?: string; }
export function RequireAuth({ children }: RequireAuthProps) {
  return <>{children}</>;
}
