"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Newsletter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { label: "Generate Newsletter", href: "/newsletter/generate" },
      { label: "Create Campaign", href: "/newsletter/campaign" },
      { label: "History", href: "/newsletter/history" },
      { label: "Manage Services", href: "/newsletter/services" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["Newsletter"]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">NewsletterHub</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isOpen = openSections.includes(item.label);
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleSection(item.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isOpen && item.children && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${active ? "bg-indigo-600" : "bg-gray-300"}`} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Powered by n8n</p>
      </div>
    </aside>
  );
}
