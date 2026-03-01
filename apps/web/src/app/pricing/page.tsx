"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic features",
    features: [
      "5 article analyses per day",
      "5 video analyses per day",
      "Sentence-by-sentence translation",
      "Key expressions extraction",
    ],
    cta: "Current Plan",
    highlighted: false,
    disabled: true,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "Unlimited learning for serious students",
    features: [
      "Unlimited article analyses",
      "Unlimited video analyses",
      "Sentence structure parsing",
      "Word lookup in context",
      "Export notes & expressions",
      "Priority AI processing",
    ],
    cta: "Get Started",
    highlighted: true,
    disabled: false,
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleSubscribe = () => {
    // TODO: Connect to payment gateway (Stripe, etc.)
    // For now, redirect to a placeholder
    alert("Payment integration coming soon!");
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 py-12 sm:py-20">
      <div className="w-full max-w-[720px] text-center space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            Simple Pricing
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-6 text-left transition-shadow ${
                plan.highlighted
                  ? "border-[var(--accent)] shadow-sm"
                  : "border-[var(--border)]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-4 bg-[var(--accent)] text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  RECOMMENDED
                </span>
              )}

              <div className="space-y-4">
                {/* Plan name & price */}
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground-secondary)]">
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-[var(--foreground)]">
                      {plan.price}
                    </span>
                    <span className="text-sm text-[var(--foreground-secondary)]">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[var(--foreground)]"
                    >
                      <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={plan.disabled ? undefined : handleSubscribe}
                  disabled={plan.disabled}
                  className={
                    plan.highlighted
                      ? "btn-primary w-full"
                      : "btn-ghost w-full"
                  }
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-[var(--foreground-secondary)]">
          Secure payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
