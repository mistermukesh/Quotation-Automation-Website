import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  image?: string;
}

function DecorIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-1 size-3.5 shrink-0 -translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)] stroke-1 stroke-faint",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function QuoteIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

function TestimonialCard({
  testimonial,
  index,
  className,
}: {
  testimonial: Testimonial;
  index: number;
  className?: string;
}) {
  const { quote, name, role, company, image } = testimonial;

  return (
    <figure
      className={cn(
        "group relative flex flex-col justify-between gap-6 px-8 pt-8 pb-6 shadow-xs md:translate-y-[calc(3rem*var(--t-card-index))]",
        "bg-[radial-gradient(50%_80%_at_25%_0%,rgba(237,237,242,0.07),transparent)]",
        className,
      )}
      style={{ "--t-card-index": index } as React.CSSProperties}
    >
      <div className="absolute -inset-y-4 -left-px w-px bg-line" />
      <div className="absolute -inset-y-4 -right-px w-px bg-line" />
      <div className="absolute -inset-x-4 -top-px h-px bg-line" />
      <div className="absolute -right-4 -bottom-px -left-4 h-px bg-line" />
      <DecorIcon />

      <blockquote className="flex gap-4">
        <QuoteIcon className="size-6 shrink-0 stroke-1 text-faint" />
        <p className="flex-1 text-base leading-relaxed font-normal text-muted">
          {quote}
        </p>
      </blockquote>

      <figcaption className="flex items-center gap-3">
        <Avatar className="size-10 rounded-full ring-2 ring-line ring-offset-2 ring-offset-background transition-shadow group-hover:ring-ink/20">
          {image ? (
            <AvatarImage alt={`${name}'s profile picture`} src={image} />
          ) : null}
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <cite className="text-sm font-medium text-ink not-italic">{name}</cite>
          <p className="text-xs text-muted">
            {role}, <span className="text-ink/80">{company}</span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials({
  eyebrow = "Testimonials",
  title,
  description,
  testimonials,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  testimonials: Testimonial[];
  className?: string;
}) {
  return (
    <section className={cn("w-full px-6 py-24", className)}>
      <div className="w-full">
        <div className="mx-auto mb-20 max-w-xl text-center">
          <p className="text-sm font-medium tracking-widest text-accent uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-muted">{description}</p>
          ) : null}
        </div>

        <div className="mx-auto -mt-10 grid w-full max-w-5xl gap-8 md:grid-cols-3 md:gap-6">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard
              key={testimonial.name}
              index={i}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
