import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, align = "left", className }: SectionHeaderProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl md:text-4xl font-display tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-[color:var(--color-navy-700)] text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
