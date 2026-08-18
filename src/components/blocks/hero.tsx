"use client";

import * as React from "react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroAction {
  label: string;
  href: string;
  variant?: "default" | "outline";
  target?: string;
  rel?: string;
}

export interface HeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  gradient?: boolean;
  blur?: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: HeroAction[];
  titleClassName?: string;
  subtitleClassName?: string;
  actionsClassName?: string;
}

export const Hero = React.forwardRef<HTMLElement, HeroProps>(
  (
    {
      className,
      gradient = true,
      blur = true,
      title,
      subtitle,
      actions,
      titleClassName,
      subtitleClassName,
      actionsClassName,
      ...props
    },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn(
        "relative z-0 flex min-h-[75vh] w-full flex-col items-center justify-center overflow-hidden bg-background py-28",
        className,
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute top-16 isolate z-0 flex w-screen flex-1 items-start justify-center">
          {blur && (
            <div className="absolute top-0 z-50 h-48 w-screen bg-transparent opacity-10 backdrop-blur-md" />
          )}

          <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-[-30%] rounded-full bg-accent/60 opacity-80 blur-3xl" />

          <motion.div
            initial={{ width: "8rem" }}
            viewport={{ once: true }}
            transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
            whileInView={{ width: "16rem" }}
            className="absolute top-0 z-30 h-36 -translate-y-[20%] rounded-full bg-accent/60 blur-2xl"
          />

          <motion.div
            initial={{ width: "15rem" }}
            viewport={{ once: true }}
            transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
            whileInView={{ width: "30rem" }}
            className="absolute inset-auto z-50 h-0.5 -translate-y-[-10%] bg-accent/60"
          />

          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={{ opacity: 1, width: "30rem" }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible bg-conic-[from_70deg_at_center_top] from-accent/60 via-transparent to-transparent"
          >
            <div className="absolute bottom-0 left-0 z-20 h-40 w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
            <div className="absolute bottom-0 left-0 z-20 h-[100%] w-40 bg-background [mask-image:linear-gradient(to_right,white,transparent)]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={{ opacity: 1, width: "30rem" }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-conic-[from_290deg_at_center_top] from-transparent via-transparent to-accent/60"
          >
            <div className="absolute right-0 bottom-0 z-20 h-[100%] w-40 bg-background [mask-image:linear-gradient(to_left,white,transparent)]" />
            <div className="absolute right-0 bottom-0 z-20 h-40 w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ y: 100, opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
        whileInView={{ y: 0, opacity: 1 }}
        className="relative z-50 container flex flex-1 flex-col justify-center gap-4 px-5 md:px-10"
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <h1
            className={cn(
              "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
              titleClassName,
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className={cn("text-xl text-muted", subtitleClassName)}>
              {subtitle}
            </p>
          )}

          {actions && actions.length > 0 && (
            <div className={cn("flex gap-4", actionsClassName)}>
              {actions.map((action, i) => (
                <Button key={i} variant={action.variant || "default"} asChild>
                  <a
                    href={action.href}
                    target={action.target}
                    rel={action.rel}
                  >
                    {action.label}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  ),
);

Hero.displayName = "Hero";
