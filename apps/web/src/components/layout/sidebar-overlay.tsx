"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Film,
  Sun,
  Moon,
  Github,
  X,
} from "lucide-react";
import { SidebarItem } from "./sidebar-item";

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarOverlay({ isOpen, onClose }: SidebarOverlayProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isStudyActive =
    pathname === "/" || pathname === "/study" || pathname.startsWith("/study");
  const isVideoActive =
    pathname === "/video" || pathname.startsWith("/analyze");

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
  };

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Dim background */}
      <div
        className="absolute inset-0 sidebar-overlay-dim"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div className="absolute left-0 top-0 bottom-0 w-[240px] bg-[var(--sidebar-bg)] border-r border-[var(--border)] animate-slide-in-left flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 h-12">
          <Link href="/" className="font-bold text-sm" onClick={onClose}>
            WIGVU
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-secondary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          <div className="sidebar-section-label">학습</div>
          <SidebarItem
            href="/"
            icon={BookOpen}
            label="읽기"
            active={isStudyActive}
            collapsed={false}
          />

          <div className="sidebar-section-label mt-4">도구</div>
          <SidebarItem
            href="/video"
            icon={Film}
            label="영상 분석"
            active={isVideoActive}
            collapsed={false}
          />
        </nav>

        {/* Utility */}
        <div className="border-t border-[var(--border)] py-2 px-3 space-y-1">
          <button onClick={toggleTheme} className="sidebar-item w-full">
            <Sun size={16} />
            <span>테마 전환</span>
          </button>
          <a
            href="https://github.com/wigtn/wigvu"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-item w-full"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
