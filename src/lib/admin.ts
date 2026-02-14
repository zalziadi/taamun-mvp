/** Admin access: ?admin=KEY must match NEXT_PUBLIC_ADMIN_KEY. Production uses query only. */
function getAdminKeyFromParams(
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>
): string | null {
  if (!searchParams) return null;
  let value: string | string[] | undefined | null;
  if (searchParams instanceof URLSearchParams) {
    value = searchParams.get("admin");
  } else {
    value = searchParams["admin"];
  }
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

/** Returns true if request is admin: ?admin=KEY matches env, or (dev only) localStorage taamun.admin=1 */
export function isAdminRequest(
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>
): boolean {
  const envKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  const paramKey = getAdminKeyFromParams(searchParams);

  if (paramKey && envKey && paramKey === envKey) return true;

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return window.localStorage.getItem("taamun.admin") === "1";
  }
  return false;
}
