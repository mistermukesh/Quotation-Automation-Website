import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
  faqsLeft: FaqItem[];
  faqsRight: FaqItem[];
  className?: string;
  id?: string;
}

export function FAQSection({
  title = "Product & Account Help",
  subtitle = "Frequently Asked Questions",
  description = "Get instant answers to the most common questions about your account, product setup, and updates.",
  buttonLabel = "Browse All FAQs →",
  buttonHref,
  faqsLeft,
  faqsRight,
  className,
  id,
}: FAQSectionProps) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-5xl px-4 py-16", className)}>
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-medium tracking-wide text-muted">
          {subtitle}
        </p>
        <h2 className="mb-3 text-3xl font-semibold md:text-4xl">{title}</h2>
        <p className="mx-auto mb-6 max-w-xl text-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-2">
        {[faqsLeft, faqsRight].map((column, columnIndex) => (
          <Accordion
            key={columnIndex}
            type="single"
            collapsible
            className="space-y-4"
          >
            {column.map((faq, i) => (
              <AccordionItem key={i} value={`item-${columnIndex}-${i}`}>
                <AccordionTrigger className="text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted">
                  <div className="min-h-[40px] transition-all duration-200 ease-in-out">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </section>
  );
}
