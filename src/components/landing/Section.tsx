import { cn } from "@/lib/utils";

export function LandingSection({
  id,
  title,
  subtitle,
  children,
  className,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-[1080px] px-5 sm:px-8 py-12 sm:py-16",
        className
      )}
    >
      {(title || subtitle) && (
        <header className="mb-8 sm:mb-10">
          {title && (
            <h2 className="font-amiri text-[26px] sm:text-[34px] leading-tight text-[color:var(--ink)]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-3 text-[14px] sm:text-[16px] text-[color:var(--text-mid)]">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
