import { cn } from "@/lib/utils";

export interface FooterLink {
  title: string;
  href: string;
  target?: string;
  rel?: string;
}

export interface FooterIconLink {
  icon: React.ReactNode;
  label: string;
  href: string;
  target?: string;
  rel?: string;
}

export function MinimalFooter({
  logo,
  description,
  columns,
  iconLinks,
  copyright,
  className,
}: {
  logo: React.ReactNode;
  description: string;
  columns: { heading: string; links: FooterLink[] }[];
  iconLinks?: FooterIconLink[];
  copyright: string;
  className?: string;
}) {
  return (
    <footer className={cn("relative", className)}>
      <div className="mx-auto max-w-5xl bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-ink/.08),transparent)] md:border-x md:border-line">
        <div className="absolute inset-x-0 h-px w-full bg-line" />

        <div className="grid grid-cols-6 gap-6 p-6 md:p-8">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            {logo}

            <p className="max-w-sm font-mono text-sm text-balance text-muted">
              {description}
            </p>

            {iconLinks && iconLinks.length > 0 && (
              <div className="flex gap-2">
                {iconLinks.map((item) => (
                  <a
                    key={item.label}
                    aria-label={item.label}
                    className="rounded-md border border-line p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    href={item.href}
                    rel={item.rel}
                    target={item.target}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((column) => (
            <div key={column.heading} className="col-span-3 w-full md:col-span-1">
              <span className="mb-1 block text-xs text-muted">
                {column.heading}
              </span>
              <div className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <a
                    key={link.title}
                    className="w-max py-1 text-sm duration-200 hover:underline"
                    href={link.href}
                    rel={link.rel}
                    target={link.target}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 h-px w-full bg-line" />

        <div className="flex flex-col justify-between gap-2 pt-4 pb-6">
          <p className="text-center text-sm font-thin text-muted">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
