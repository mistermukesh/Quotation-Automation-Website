"use client";

import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Maximize2,
  Phone,
  Ruler,
  User,
} from "lucide-react";

const APPLICATIONS = ["Indoor", "Outdoor", "Rental", "Not sure yet"];
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyn2ahc1EjrQ5WBam0joAGQZVd0ubxlBjzHpCpyx7THx7AkRejf8jUjImzNSieAuA0z/exec";

export function QuoteForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(data),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Form submission error:", err);
      setError("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="enquiry"
      className="w-full max-w-lg space-y-6 rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg"
    >
      <div>
        <h2 className="text-2xl font-bold text-white">
          Get pricing &amp; technical support
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Register your requirement. Quotation turnaround is 24–48 hours.
        </p>
      </div>

      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Request Submitted!</h3>
          <p className="text-sm text-gray-300">
            Thank you for registering your requirement. We will contact you within 24–48 hours.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs font-medium text-accent-soft hover:underline focus:outline-none"
          >
            Submit another requirement
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          <input type="hidden" name="source_page" value="/resellers" />
          <div className="grid gap-7 sm:grid-cols-2">
            <Field id="name" label="Name" icon={User} required />
            <Field id="company" label="Company" icon={Building2} required />
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <Field
              id="phone"
              label="Phone / WhatsApp"
              icon={Phone}
              type="tel"
              required
            />
            <Field id="city" label="City" icon={MapPin} required />
          </div>

          <div>
            <label
              htmlFor="application"
              className="mb-2 block text-xs text-gray-300"
            >
              <Maximize2 className="mr-2 -mt-1 inline-block" size={14} />
              Application
            </label>
            <select
              id="application"
              name="application"
              defaultValue=""
              required
              className="w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 text-sm text-white focus:border-accent focus:ring-0 focus:outline-none [&>option]:bg-surface"
            >
              <option value="" disabled>
                Select one
              </option>
              {APPLICATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <Field id="screen-size" label="Screen size" icon={Ruler} />
            <Field id="pixel-pitch" label="Pixel pitch" icon={Maximize2} />
          </div>

          <Field
            id="project"
            label="Client / Project (optional)"
            icon={Briefcase}
          />

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 font-semibold text-white transition-all duration-300 hover:bg-accent-soft focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black focus:outline-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Request a quote
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  icon: typeof User;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="relative z-0">
      <input
        type={type}
        id={id}
        name={id}
        required={required}
        placeholder=" "
        className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-white focus:border-accent focus:ring-0 focus:outline-none"
      />
      <label
        htmlFor={id}
        className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 text-sm text-gray-300 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-accent-soft"
      >
        <Icon className="mr-2 -mt-1 inline-block" size={16} />
        {label}
      </label>
    </div>
  );
}
