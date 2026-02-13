"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { LanguageSelector } from "@/components/language-selector";
import { SidebarOverlay } from "./sidebar-overlay";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sm:hidden flex items-center justify-between px-4 h-12 border-b border-[var(--border)] bg-[var(--background)]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 text-[var(--foreground-secondary)]"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="font-bold text-sm">
          WIGVU
        </Link>
        <LanguageSelector collapsed={true} />
      </header>
      <SidebarOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
