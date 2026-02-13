"use client";

import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/shared/types/languages";

interface LanguageSelectorProps {
  collapsed: boolean;
  dropdownPosition?: "sidebar" | "topbar";
}

export function LanguageSelector({ collapsed, dropdownPosition = "sidebar" }: LanguageSelectorProps) {
  const [selected, setSelected] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedLanguage");
    if (stored) setSelected(stored);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    localStorage.setItem("selectedLanguage", code);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("languageChange", { detail: code }));
  };

  const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === selected);

  if (collapsed) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-secondary)] transition-colors"
          title={selectedLang?.label || "Language"}
        >
          <Globe size={16} />
        </button>
        {isOpen && (
          <div
            className={`absolute bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px] z-50 ${
              dropdownPosition === "topbar"
                ? "top-full right-0 mt-1"
                : "left-full top-0 ml-2"
            }`}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--background-secondary)] transition-colors ${
                  selected === lang.code
                    ? "text-[var(--accent)] font-medium"
                    : "text-[var(--foreground)]"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-item w-full"
      >
        <Globe size={16} />
        <span>{selectedLang?.label || "English"}</span>
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--background-secondary)] transition-colors ${
                selected === lang.code
                  ? "text-[var(--accent)] font-medium"
                  : "text-[var(--foreground)]"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
