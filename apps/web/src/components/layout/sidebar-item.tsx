"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
}

export function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: SidebarItemProps) {
  if (collapsed) {
    return (
      <Link
        href={href}
        className={`flex items-center justify-center mx-2 p-2 rounded-md transition-colors ${
          active
            ? "text-[var(--foreground)] bg-[var(--background-secondary)] border-l-2 border-l-[var(--accent)]"
            : "text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] border-l-2 border-l-transparent"
        }`}
        title={label}
      >
        <Icon size={16} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`sidebar-item ${active ? "active" : ""}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}
