"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Heart } from "lucide-react";

export function Navigation() {
  return (
    <header className="border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              wigtn
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg font-medium tracking-tight text-muted-foreground">
              QuickPreview
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/wigtn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="w-4 h-4 text-foreground" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
