import { ReactNode } from "react";

export default function Header({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between flex-wrap gap-4">
      <div>
        {eyebrow && <p className="label-mono text-cyan-ice/70">{eyebrow}</p>}
        <h1 className="title-display text-md md:text-3xl text-foreground mt-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}
