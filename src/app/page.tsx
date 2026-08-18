import Image from "next/image";
import {
  ArrowRight,
  Award,
  ClipboardCheck,
  FileCheck2,
  FileX2,
  Landmark,
  Layers,
  Mail,
  MapPinned,
  MapPinOff,
  MessageCircle,
  OctagonAlert,
  Phone,
  ShieldCheck,
  Timer,
  TrendingDown,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Hero as LampHero } from "@/components/blocks/hero";
import { FAQSection } from "@/components/ui/faq-section";
import { GradientCard } from "@/components/ui/gradient-card";
import { MinimalFooter } from "@/components/ui/minimal-footer";
import { QuoteForm } from "@/components/ui/quote-form";
import { Testimonials } from "@/components/ui/testimonials";

const NAV = [
  { label: "Home", href: "#top" },
  { label: "Products", href: "#products" },
  { label: "What we do", href: "#solutions" },
  { label: "Why KAN", href: "#why" },
  { label: "Projects", href: "#projects" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#enquiry" },
];

export const CONTACT = {
  phone: "+91 93104 03361",
  phoneHref: "tel:+919310403361",
  email: "sales@kanuniversal.com",
  whatsapp:
    "https://wa.me/919310403361?text=" +
    encodeURIComponent(
      "Hi KAN Universal, I'm an LED/AV reseller. I'd like protected pricing and a spec check on a deal.",
    ),
};

const TRUST = [
  { value: "10+ Years", label: "In LED video walls & AV systems" },
  { value: "1,000+", label: "Projects completed across India" },
  { value: "₹100 Cr+", label: "Project value delivered" },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Your price stays yours",
    body: "Deal registration locks your price. The lead isn't shopped around to other dealers on the same client.",
    tint: "cool",
  },
  {
    icon: ClipboardCheck,
    title: "Spec checked before you quote",
    body: "Technical review of pitch, cabinet, and controller, so you don't get caught out at the client's review stage.",
    tint: "neutral",
  },
  {
    icon: Layers,
    title: "Structured channel pricing",
    body: "Three defined tiers you can plan margin against, with no fresh renegotiation on every single deal.",
    tint: "green",
  },
  {
    icon: Timer,
    title: "Fast quotation turnaround",
    body: "BOM-ready pricing in 24–48 hours, so you don't lose the client while waiting on your supplier.",
    tint: "warm",
  },
];

const PAINS = [
  {
    icon: Users,
    lead: "Same lead quoted by 3–5 dealers",
    body: "Race-to-bottom pricing wipes out the margin you built in.",
    span: "md:col-span-4 md:row-span-2",
    img: "/loosing/price-competition.jpeg",
  },
  {
    icon: TriangleAlert,
    lead: "Wrong pixel pitch or controller, caught at technical review",
    body: "Re-quote, lose margin, or lose the ₹15–50 lakh project outright.",
    span: "md:col-span-2",
    img: "/loosing/technical-error.jpeg",
  },
  {
    icon: MapPinOff,
    lead: "No installation support outside your city",
    body: "You absorb the coordination cost, the delay, and any penalty clause.",
    span: "md:col-span-2",
    img: "/loosing/installation-support.jpeg",
  },
  {
    icon: FileX2,
    lead: "Missing one tender document",
    body: "GeM/PSU bid disqualified over paperwork, on a deal worth lakhs or sometimes crores.",
    span: "md:col-span-2",
    img: "/loosing/missing-tender.jpeg",
  },
  {
    icon: TrendingDown,
    lead: "Pricing renegotiated every time",
    body: "No consistency to plan your margin around.",
    span: "md:col-span-2",
    img: "/loosing/pricing-renegotiation.jpeg",
  },
  {
    icon: OctagonAlert,
    lead: "A committed project stalls at spec or install",
    body: "Real money, a damaged client relationship, and a reference project you don't get to use.",
    span: "md:col-span-2",
    img: "/loosing/stalled-project.jpeg",
  },
];

const CAPABILITIES = [
  {
    badgeText: "Before you quote",
    badgeColor: "#d6006c",
    title: "Correct spec selection",
    description:
      "Pixel pitch, controller, and mounting checked before the number reaches your client.",
    ctaText: "Get a spec check",
    icon: <ClipboardCheck className="h-full w-full" strokeWidth={1} />,
    gradient: "pink" as const,
  },
  {
    badgeText: "Registered deals",
    badgeColor: "#8B5CF6",
    title: "Price protection",
    description:
      "Every registered deal is locked to you. No other dealer undercuts your number.",
    ctaText: "Register a deal",
    icon: <ShieldCheck className="h-full w-full" strokeWidth={1} />,
    gradient: "purple" as const,
  },
  {
    badgeText: "3 tiers",
    badgeColor: "#4B5563",
    title: "Structured channel pricing",
    description:
      "Slabs you can plan margin against, instead of case-by-case negotiation.",
    ctaText: "See your tier",
    icon: <Layers className="h-full w-full" strokeWidth={1} />,
    gradient: "gray" as const,
  },
  {
    badgeText: "24–48 hours",
    badgeColor: "#0EA5E9",
    title: "BOM-ready quotations",
    description:
      "Full bill of materials and spec sheet back in your hands within two working days.",
    ctaText: "Request a quote",
    icon: <Timer className="h-full w-full" strokeWidth={1} />,
    gradient: "blue" as const,
  },
  {
    badgeText: "Pan-India",
    badgeColor: "#10B981",
    title: "Installation coordination",
    description:
      "Site work handled when the project lands outside your home city.",
    ctaText: "Check your city",
    icon: <MapPinned className="h-full w-full" strokeWidth={1} />,
    gradient: "green" as const,
  },
  {
    badgeText: "Govt & PSU",
    badgeColor: "#F59E0B",
    title: "Tender & GeM documentation",
    description:
      "Compliance paperwork prepared when your deal touches a government buyer.",
    ctaText: "Talk to us",
    icon: <FileCheck2 className="h-full w-full" strokeWidth={1} />,
    gradient: "orange" as const,
  },
];

const SUPPLY = [
  ["Indoor LED panels", "P1.5 to P6"],
  ["Outdoor LED panels", "P4 to P10"],
  ["Rental cabinets", "P2.5, P3.79, P4.8"],
  ["Controllers", "KY Star (recommended), Novastar-compatible"],
  ["Structures", "Indoor/outdoor mounting, fabrication options"],
  ["Documentation", "Full BOM, spec sheet, technical compliance on request"],
];

const REASONS = [
  {
    icon: ShieldCheck,
    lead: "Price protection on registered deals",
    body: "Your margin isn't undercut by another dealer working the same lead.",
  },
  {
    icon: ClipboardCheck,
    lead: "Correct spec the first time",
    body: "No losing deals at the client's technical review.",
  },
  {
    icon: Layers,
    lead: "Structured pricing tiers",
    body: "Plan your margin instead of renegotiating every time.",
  },
  {
    icon: MapPinned,
    lead: "Pan-India installation coordination",
    body: "Quote projects outside your home city with confidence.",
  },
  {
    icon: Award,
    lead: "1,000+ projects, ₹100 Cr+ delivered",
    body: "Proof you can put in front of your client.",
  },
  {
    icon: Landmark,
    lead: "Govt, PSU & defence experience",
    body: "Useful if your network touches tender-facing buyers.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "KAN Universal delivered an exceptional LED video wall solution for our corporate headquarters. The installation quality, screen clarity, and finishing were absolutely premium. Their team maintained complete professionalism throughout the project.",
    name: "Rahul Mehta",
    role: "Corporate Projects Head",
    company: "Enterprise Client",
  },
  {
    quote:
      "We partnered with KAN Universal for our auditorium LED display setup, and the results were outstanding. The visuals are incredibly sharp, and the entire integration process was smooth and well-managed from start to finish.",
    name: "Anjali Verma",
    role: "Infrastructure Lead",
    company: "Premier Institution",
  },
  {
    quote:
      "The LED video wall installed by KAN Universal has completely transformed our presentation space. Their technical expertise, timely execution, and after-sales support truly reflect their commitment to quality and innovation.",
    name: "Vikram Sethi",
    role: "AV Integration Partner",
    company: "Systems Integrator",
  },
];

// Each entry is one bento column: a full-height tile, or two stacked tiles.
const GALLERY = [
  {
    width: "w-[320px]",
    tiles: [
      {
        src: "/projects/bel.jpeg",
        name: "Bharat Electronics (BEL)",
        meta: "Indoor auditorium LED wall",
      },
    ],
  },
  {
    width: "w-[420px]",
    tiles: [
      {
        src: "/projects/air-force.png",
        name: "Indian Air Force",
        meta: "Outdoor recruitment display · New Delhi",
      },
      {
        src: "/projects/install-01.jpeg",
        name: "BSF headquarters",
        meta: "Conference room video wall",
      },
    ],
  },
  {
    width: "w-[300px]",
    tiles: [
      {
        src: "/projects/wall-05.jpeg",
        name: "Defence briefing room",
        meta: "Curved indoor LED wall",
      },
    ],
  },
  {
    width: "w-[420px]",
    tiles: [
      {
        src: "/projects/bhel.jpeg",
        name: "BHEL",
        meta: "Outdoor pole-mounted LED",
      },
      {
        src: "/projects/indian-army-mumbai.png",
        name: "Indian Army",
        meta: "Conference room display · Mumbai",
      },
    ],
  },
  {
    width: "w-[300px]",
    tiles: [
      {
        src: "/projects/install-03.jpeg",
        name: "Hillside outdoor LED",
        meta: "Weatherproof cabinet, stone-clad structure",
      },
    ],
  },
  {
    width: "w-[420px]",
    tiles: [
      {
        src: "/projects/ntpc-outdoor.jpg",
        name: "NTPC",
        meta: "Outdoor pole-mounted LED",
      },
      {
        src: "/projects/ntpc-indoor.jpg",
        name: "NTPC",
        meta: "Indoor LED display",
      },
    ],
  },
  {
    width: "w-[300px]",
    tiles: [
      {
        src: "/projects/wall-03.jpeg",
        name: "Retail LED totem",
        meta: "Shopping mall storefront",
      },
    ],
  },
  {
    width: "w-[420px]",
    tiles: [
      {
        src: "/projects/wall-01.jpeg",
        name: "Mufti storefront",
        meta: "Retail façade LED",
      },
      {
        src: "/projects/install-05.jpeg",
        name: "Mobile LED van",
        meta: "Rental · outdoor campaign",
      },
    ],
  },
];

const PROCESS = [
  {
    icon: ClipboardCheck,
    title: "Register your lead",
    body: "Share client details and site requirement with KAN Universal",
  },
  {
    icon: ShieldCheck,
    title: "Spec review + protected pricing",
    body: "Technical check on pitch, cabinet, and controller before you quote",
  },
  {
    icon: FileCheck2,
    title: "BOM-ready quotation",
    body: "Priced and documented, ready to present to your client",
  },
  {
    icon: MapPinned,
    title: "Installation coordination",
    body: "Available pan-India if the site sits outside your base city",
  },
];

const FAQS = [
  {
    q: "Who can register as a dealer with KAN Universal?",
    a: "Any active AV/LED reseller can apply for dealer registration. Your pricing tier depends on volume and deal history.",
  },
  {
    q: "How does price protection work?",
    a: "Once you register a client lead, that price is locked for you on that deal. It isn't offered to other dealers quoting the same client.",
  },
  {
    q: "Will KAN Universal quote my end client directly, bypassing me?",
    a: "No. Once a deal is registered under your name, we work through you, not around you.",
  },
  {
    q: "What if another dealer already has the same lead?",
    a: "Whoever registers the deal first with correct client details holds the protection on it.",
  },
  {
    q: "Do you review the spec before I quote, or after?",
    a: "Before. Our technical team checks pixel pitch, cabinet size, and controller fit before you send pricing to your client.",
  },
  {
    q: "Can you provide GeM/tender documentation if my client needs it?",
    a: "Yes, on request: datasheets, compliance papers, and country-of-origin documents.",
  },
  {
    q: "Do you support installation outside my city?",
    a: "Yes, we coordinate installation pan-India.",
  },
  {
    q: "What's the typical quotation turnaround?",
    a: "24–48 hours once screen size, location, and indoor/outdoor requirement are shared.",
  },
  {
    q: "Is there a minimum order size to register as a dealer?",
    a: "No fixed minimum. Share your typical deal size and we'll confirm your pricing tier.",
  },
  {
    q: "What products can I sell under this program?",
    a: "Indoor and outdoor LED panels, rental cabinets, controllers, and structures. The full supply list is above.",
  },
];

export default function Home() {
  return (
    <>
      <main className="w-full">
        <SiteNav />
        <Hero />
        <TrustStrip />
        {/* <Benefits /> */}
        <Pains />
        <Supply />
        <Capabilities />
        <Reasons />
        <Proof />
        <Testimonials
          eyebrow="Testimonials"
          title="What our partners & clients say"
          description="Hear from leaders, institutions, and AV integrators across India."
          testimonials={TESTIMONIALS}
        />
        {/* <Process /> */}
        {/* <MidCta /> */}
        <FinalCta />
        <Faq />
      </main>
      <SiteFooter />
      <StickyBar />
      <FaqSchema />
    </>
  );
}

function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center" aria-label="KAN Universal">
          <Image
            src="/kan-logo.png"
            alt="KAN Universal"
            width={3760}
            height={1302}
            priority
            className="h-10 w-auto"
          />
        </a>
        <ul className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-[13px] text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#enquiry"
          className="rounded-full bg-accent px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-soft"
        >
          Get Pricing
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-32 pb-20 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-accent">
            FOR REGISTERED LED &amp; AV RESELLERS
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            <span className="text-accent">
              Protected pricing on every registered deal
            </span>{" "}
            on LED video wall supply for resellers
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Correct spec, fast quotation, and pricing that stays yours once a
            deal is registered, backed by 1,000+ completed projects across
            India.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#enquiry"
              className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
            >
              Get Pricing &amp; Technical Support
            </a>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              Send Requirement on WhatsApp
            </a>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-line">
      <div className="mx-auto grid max-w-7xl sm:grid-cols-3">
        {TRUST.map((item) => (
          <div
            key={item.value}
            className="border-line px-6 py-8 not-first:border-t sm:not-first:border-t-0 sm:not-first:border-l"
          >
            <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {item.value}
            </div>
            <div className="mt-2 text-xs text-faint">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-10">
      <p className="text-[11px] font-medium tracking-[0.22em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="mt-3 max-w-2xl text-sm text-faint">{body}</p> : null}
    </div>
  );
}

function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHead
        eyebrow="BUILT FOR RESELLERS"
        title="Built for resellers across India"
        body="Four things that decide whether you keep the deal, handled before you send your quote."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, body, tint }) => (
          <article
            key={title}
            className="relative isolate overflow-hidden rounded-xl border border-line p-6"
          >
            <div className={`photo photo-${tint} absolute inset-0 -z-10 opacity-70`} />
            <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
            <h3 className="mt-20 text-base font-semibold leading-tight">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pains() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHead
        eyebrow="THE PROBLEM"
        title="Losing deals to price wars and wrong specs?"
        body="A single mistake here isn't a delay. It's margin, or the whole project."
      />
      <div className="grid gap-4 md:grid-cols-6 md:auto-rows-[minmax(200px,auto)]">
        {PAINS.map(({ icon: Icon, lead, body, span, img }, i) => (
          <article
            key={lead}
            className={`${span} flex flex-col overflow-hidden rounded-xl border border-line border-t-accent/50 bg-surface`}
          >
            <div
              className={`relative w-full overflow-hidden ${
                i === 0 ? "min-h-[240px] flex-1" : "h-40"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes={
                  i === 0
                    ? "(max-width: 768px) 100vw, 840px"
                    : "(max-width: 768px) 100vw, 420px"
                }
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <Icon
                className={`text-accent ${i === 0 ? "h-6 w-6" : "h-5 w-5"}`}
                strokeWidth={1.5}
              />
              <h3
                className={`mt-4 font-semibold leading-tight ${
                  i === 0 ? "text-xl sm:text-2xl" : "text-sm"
                }`}
              >
                {lead}
              </h3>
              <p
                className={`mt-2 leading-relaxed text-muted ${
                  i === 0 ? "max-w-md text-base" : "text-sm"
                }`}
              >
                {body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="solutions" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
      <SectionHead
        eyebrow="WHAT WE DO"
        title="What KAN Universal does for registered resellers"
        body="Backed by 1,000+ completed projects and ₹100 Cr+ delivered across India."
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        {CAPABILITIES.map((card) => (
          <GradientCard key={card.title} {...card} ctaHref="#enquiry" />
        ))}
      </div>
    </section>
  );
}

function Supply() {
  return (
    <section id="products" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-[11px] font-medium tracking-[0.22em] text-accent">
          PRODUCT RANGE
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          What we supply
        </h2>
      </div>
      <dl className="mx-auto max-w-3xl">
        {SUPPLY.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1 border-t border-line py-5 last:border-b sm:grid-cols-[14rem_1fr] sm:items-baseline sm:gap-8"
          >
            <dt className="text-sm font-semibold">{label}</dt>
            <dd className="text-sm text-muted">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Reasons() {
  return (
    <section id="why" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-[11px] font-medium tracking-[0.22em] text-accent">
          WHY KAN UNIVERSAL
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Why resellers work with KAN Universal
        </h2>
        <p className="mt-3 text-sm text-faint">
          One supply partner behind your quote: pricing you can plan around,
          specs checked before the client sees them, and installation covered
          wherever the project lands.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl divide-x divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((reason) => (
          <article key={reason.lead} className="p-8">
            <div className="flex items-center gap-3">
              <reason.icon className="h-5 w-5 shrink-0 text-accent" />
              <h3 className="text-sm font-semibold">{reason.lead}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {reason.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section id="projects" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
      <SectionHead
        eyebrow="PROOF"
        title="1,000+ projects, ₹100 Cr+ delivered"
        body="10+ years in LED video walls and AV systems, across government, defence, PSU, hospitality, enterprise, and retail."
      />
      <div className="bento bento-mask overflow-hidden">
        <div className="bento-track flex w-max gap-4 pr-4">
          {[...GALLERY, ...GALLERY].map((column, i) => (
            <div
              key={i}
              aria-hidden={i >= GALLERY.length}
              className={`${column.width} flex h-[460px] shrink-0 flex-col gap-4`}
            >
              {column.tiles.map((tile) => (
                <GalleryTile key={tile.src} {...tile} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryTile({
  src,
  name,
  meta,
}: {
  src: string;
  name: string;
  meta: string;
}) {
  return (
    <figure className="relative isolate min-h-0 flex-1 overflow-hidden rounded-lg border border-line">
      <Image
        src={src}
        alt={`${name}, ${meta}`}
        fill
        sizes="420px"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 p-5">
        <div className="text-sm font-semibold">{name}</div>
        <div className="mt-1 text-xs text-gray-300">{meta}</div>
      </figcaption>
    </figure>
  );
}

function Process() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHead
        eyebrow="HOW IT WORKS"
        title="Requirement to quotation"
        body="Four steps from registering the lead to putting a priced BOM in front of your client."
      />
      <div className="relative">
        <div className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-accent/10 via-accent/60 to-accent/10 md:block" />
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {PROCESS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-accent/40 bg-surface text-accent">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-sm font-semibold">
                <span className="text-accent">{i + 1}. </span>
                {title}
              </h3>
              <p className="mx-auto mt-2 max-w-[15rem] text-xs leading-relaxed text-faint">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-2xl border border-line bg-surface p-8 sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#enquiry"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
          >
            Get Pricing &amp; Technical Support
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-medium transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            Send Requirement on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function MidCta() {
  return (
    <CtaBand
      title="Protect your next deal before you quote it"
      body="Register your lead and get technical + pricing review before you commit."
    />
  );
}

function FinalCta() {
  return (
    <LampHero
      title={
        <>
          Get protected pricing on
          <br />
          your next deal
        </>
      }
      subtitle="Register your lead and get a technical spec check before you quote."
      actions={[
        { label: "Get Pricing & Technical Support", href: "#enquiry" },
        {
          label: "Send Requirement on WhatsApp",
          href: CONTACT.whatsapp,
          variant: "outline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ]}
      titleClassName="text-3xl sm:text-4xl md:text-5xl text-center"
      subtitleClassName="text-base md:text-lg max-w-[600px] text-center"
      actionsClassName="mt-8 flex-wrap justify-center"
    />
  );
}

function Faq() {
  const items = FAQS.map(({ q, a }) => ({ question: q, answer: a }));
  const split = Math.ceil(items.length / 2);

  return (
    <FAQSection
      subtitle="FAQ"
      title="Common questions"
      description="Deal registration, spec review, pricing tiers, and how we work alongside you on your client's project."
      buttonLabel="Register a deal →"
      buttonHref="#enquiry"
      faqsLeft={items.slice(0, split)}
      faqsRight={items.slice(split)}
      className="scroll-mt-20 py-20"
      id="faq"
    />
  );
}

function SiteFooter() {
  return (
    <MinimalFooter
      className="pb-24 md:pb-0"
      logo={
        <a href="#top" className="flex w-max items-center" aria-label="KAN Universal">
          <Image
            src="/kan-logo.png"
            alt="KAN Universal"
            width={3760}
            height={1302}
            className="h-11 w-auto"
          />
        </a>
      }
      description="LED video wall and AV systems integrator based in Delhi NCR, with pan-India project execution."
      iconLinks={[
        {
          icon: <MessageCircle className="size-4" />,
          label: "WhatsApp",
          href: CONTACT.whatsapp,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          icon: <Phone className="size-4" />,
          label: CONTACT.phone,
          href: CONTACT.phoneHref,
        },
        {
          icon: <Mail className="size-4" />,
          label: CONTACT.email,
          href: `mailto:${CONTACT.email}`,
        },
      ]}
      columns={[
        {
          heading: "Resellers",
          links: [
            { title: "Register a deal", href: "#enquiry" },
            { title: "Get a spec check", href: "#enquiry" },
            {
              title: "WhatsApp us",
              href: CONTACT.whatsapp,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          ],
        },
        {
          heading: "Company",
          links: [
            { title: CONTACT.phone, href: CONTACT.phoneHref },
            { title: "Email us", href: `mailto:${CONTACT.email}` },
            { title: "Privacy Policy", href: "#" },
            { title: "Terms of Service", href: "#" },
          ],
        },
      ]}
      copyright={`© KAN Universal. All rights reserved ${new Date().getFullYear()}`}
    />
  );
}

function StickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <a
        href="#enquiry"
        className="flex flex-1 items-center justify-center rounded-full bg-accent px-4 py-3 text-sm font-medium text-white"
      >
        Get Pricing
      </a>
      <a
        href={CONTACT.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}

function FaqSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
