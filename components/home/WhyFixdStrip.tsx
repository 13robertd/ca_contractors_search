"use client";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

/**
 * “Why Fixd” value props — flat strip, borders only (no card / fill).
 */
export default function WhyFixdStrip() {
  const items = [
    {
      icon: CheckCircle2,
      title: "CSLB at the source",
      body: "License status, bonds, and coverage drawn from the same public data homeowners rely on.",
    },
    {
      icon: Shield,
      title: "Signals you can use",
      body: "We surface what matters — active license, workers' comp, bond, and clear risk flags.",
    },
    {
      icon: AlertTriangle,
      title: "No lead circus",
      body: "Browse and compare without paywalls, fake reviews, or bidding wars for your phone number.",
    },
  ];

  return (
    <section
      aria-labelledby="why-fixd-heading"
      className="my-8 border-t border-b border-gray-100 py-12"
    >
      <div className="page-container">
        <h2
          id="why-fixd-heading"
          className="sr-only"
        >
          Why Fixd
        </h2>
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon
                size={24}
                strokeWidth={1.75}
                className="text-gray-400"
                aria-hidden
              />
              <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
