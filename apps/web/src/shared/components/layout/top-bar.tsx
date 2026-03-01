"use client";

import Link from "next/link";
import { LanguageSelector } from "@/shared/components/language-selector";

export function TopBar() {
  return (
    <div className="hidden sm:flex items-center justify-end gap-4 px-4 h-10 border-b border-[var(--border)] bg-[var(--background)] text-sm">
      <Link
        href="/pricing"
        className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
      >
        Pricing
      </Link>
      <LanguageSelector collapsed={true} dropdownPosition="topbar" />
      <button className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
        Login
      </button>
    </div>
  );
}
