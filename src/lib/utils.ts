type ClassValue = string | undefined | null | false;

export function cn(...inputs: (ClassValue | ClassValue[])[]): string {
  return inputs
    .flat()
    .filter((x): x is string => Boolean(x))
    .join(" ");
}
