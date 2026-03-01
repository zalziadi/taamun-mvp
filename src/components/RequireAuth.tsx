"use client";

// Auth is no longer required — all content is public.
interface RequireAuthProps {
  children: React.ReactNode;
  next?: string;
}

export function RequireAuth({ children }: RequireAuthProps) {
  return <>{children}</>;
}
