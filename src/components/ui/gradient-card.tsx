"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Pastel wash sits on an overlay that only fades in on hover, so the card
// matches the dark page at rest.
const gradientVariants = cva(
  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
  {
    variants: {
      gradient: {
        orange: "bg-gradient-to-br from-orange-100 to-amber-200/50",
        gray: "bg-gradient-to-br from-slate-100 to-slate-200/50",
        purple: "bg-gradient-to-br from-purple-100 to-indigo-200/50",
        green: "bg-gradient-to-br from-emerald-100 to-teal-200/50",
        pink: "bg-gradient-to-br from-rose-100 to-pink-200/50",
        blue: "bg-gradient-to-br from-sky-100 to-cyan-200/50",
      },
    },
    defaultVariants: { gradient: "gray" },
  },
);

const iconVariants = cva(
  "pointer-events-none absolute -right-[12%] -bottom-[18%] w-3/5 text-white/8 transition-colors duration-300",
  {
    variants: {
      gradient: {
        orange: "group-hover:text-amber-500/25",
        gray: "group-hover:text-slate-500/25",
        purple: "group-hover:text-indigo-500/25",
        green: "group-hover:text-teal-500/25",
        pink: "group-hover:text-rose-500/25",
        blue: "group-hover:text-cyan-500/25",
      },
    },
    defaultVariants: { gradient: "gray" },
  },
);

const cardMotion = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -4 },
};

const iconMotion = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 3 },
};

export interface GradientCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientVariants> {
  badgeText: string;
  badgeColor: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  // A rendered element, not a component: this crosses the server/client boundary.
  icon: React.ReactNode;
}

export const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  (
    {
      className,
      gradient,
      badgeText,
      badgeColor,
      title,
      description,
      ctaText,
      ctaHref,
      icon,
      ...props
    },
    ref,
  ) => (
    <motion.div
      variants={cardMotion}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="h-full"
      ref={ref}
    >
      <div
        className={cn(
          "group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-8 transition-[box-shadow,border-color] duration-300 hover:border-transparent hover:shadow-lg",
          className,
        )}
        {...props}
      >
        <div className={gradientVariants({ gradient })} />

        <motion.div
          variants={iconMotion}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className={iconVariants({ gradient })}
          aria-hidden
        >
          {icon}
        </motion.div>

        <div className="z-10 flex h-full flex-col">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-1 text-sm font-medium text-muted backdrop-blur-sm transition-colors duration-300 group-hover:border-transparent group-hover:bg-white/60 group-hover:text-slate-800">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: badgeColor }}
            />
            {badgeText}
          </div>

          <div className="flex-grow">
            <h3 className="mb-2 text-2xl font-bold text-ink transition-colors duration-300 group-hover:text-slate-900">
              {title}
            </h3>
            <p className="max-w-xs text-muted transition-colors duration-300 group-hover:text-slate-700">
              {description}
            </p>
          </div>

          <a
            href={ctaHref}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors duration-300 group-hover:text-slate-900"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </motion.div>
  ),
);

GradientCard.displayName = "GradientCard";
