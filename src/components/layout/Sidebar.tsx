"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

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

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["Newsletter"]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-gray-200 flex-col shrink-0">
        <SidebarContent
          pathname={pathname}
          openSections={openSections}
          toggleSection={toggleSection}
          onLinkClick={handleLinkClick}
        />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">NewsletterHub</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <SidebarContent
          pathname={pathname}
          openSections={openSections}
          toggleSection={toggleSection}
          onLinkClick={handleLinkClick}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  openSections,
  toggleSection,
  onLinkClick,
}: {
  pathname: string;
  openSections: string[];
  toggleSection: (label: string) => void;
  onLinkClick: () => void;
}) {
  return (
    <>
      {/* Logo — desktop only */}
      <div className="px-6 py-5 border-b border-gray-200 hidden lg:block">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">NewsletterHub</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                        onClick={onLinkClick}
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
    </>
  );
}
