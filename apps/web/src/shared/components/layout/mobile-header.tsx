"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { SidebarOverlay } from "./sidebar-overlay";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sm:hidden flex items-center justify-between px-4 h-12 border-b border-[var(--border)] bg-[var(--background)]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 text-[var(--foreground-secondary)]"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="font-bold text-sm">
          WIGVU
        </Link>
        <div className="w-6" />
      </header>
      <SidebarOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
