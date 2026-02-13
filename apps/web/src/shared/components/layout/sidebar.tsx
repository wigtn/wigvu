"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Newspaper,
  Film,
  Sun,
  Moon,
  Github,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { SidebarItem } from "./sidebar-item";

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebarExpanded");
    if (stored !== null) {
      setIsExpanded(JSON.parse(stored));
    } else {
      // Tablet default: collapsed
      setIsExpanded(window.innerWidth > 1024);
    }
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebarExpanded", JSON.stringify(isExpanded));
    }
  }, [isExpanded, mounted]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
  };

  const isStudyActive =
    pathname === "/" || pathname === "/study" || pathname.startsWith("/study");
  const isReadActive = pathname === "/read" || pathname.startsWith("/read");
  const isVideoActive =
    pathname === "/video" || pathname.startsWith("/analyze");

  if (!mounted) return null;

  return (
    <aside
      className="app-sidebar hidden sm:flex"
      style={{ width: isExpanded ? 240 : 48 }}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-3 py-3 h-12">
        {isExpanded && (
          <Link href="/" className="font-bold text-sm tracking-tight">
            WIGVU
          </Link>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-secondary)] transition-colors"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <PanelLeftClose size={16} />
          ) : (
            <PanelLeftOpen size={16} />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2">
        <div className="sidebar-section-label" style={{ display: isExpanded ? "block" : "none" }}>
          Learn
        </div>
        <SidebarItem
          href="/"
          icon={BookOpen}
          label="Read"
          active={isStudyActive}
          collapsed={!isExpanded}
        />
        <SidebarItem
          href="/read"
          icon={Newspaper}
          label="Articles"
          active={isReadActive}
          collapsed={!isExpanded}
        />

        <div className="sidebar-section-label mt-4" style={{ display: isExpanded ? "block" : "none" }}>
          Tools
        </div>
        <SidebarItem
          href="/video"
          icon={Film}
          label="Video Analysis"
          active={isVideoActive}
          collapsed={!isExpanded}
        />
      </nav>

      {/* Utility */}
      <div className="border-t border-[var(--border)] py-2">
        {isExpanded ? (
          <div className="px-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="sidebar-item w-full"
            >
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
              <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
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
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-secondary)] transition-colors"
              title={isDark ? "Dark Mode" : "Light Mode"}
            >
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
