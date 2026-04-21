"use client";

import { useState } from "react";
import { useNewsletterHistory, NewsletterHistoryItem } from "@/context/NewsletterHistoryContext";
import EmailPreview from "./EmailPreview";

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function StatusBadge({ status }: { status: NewsletterHistoryItem["status"] }) {
  if (status === "proceeded") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
      Generated
    </span>
  );
}

function HistoryCard({ item, onRemove }: { item: NewsletterHistoryItem; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!item.templateId) return;
    navigator.clipboard.writeText(item.templateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {item.service}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{item.topic}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title={expanded ? "Collapse" : "View preview"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Template ID row (if proceeded) */}
      {item.templateId && (
        <div className="mx-5 mb-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Template ID</p>
            <p className="text-xs font-mono text-gray-700 truncate">{item.templateId}</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Copy"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Expanded email preview */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {item.newsletter ? (
            <EmailPreview data={item.newsletter} />
          ) : item.rawFallback ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{item.rawFallback}</pre>
          ) : (
            <p className="text-sm text-gray-400">No preview available.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewsletterHistory() {
  const { history, removeEntry, clearHistory } = useNewsletterHistory();
  const [filter, setFilter] = useState<"all" | "generated" | "proceeded">("all");

  const filtered = history.filter((item) => filter === "all" || item.status === filter);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter History</h1>
        <p className="text-gray-500 mt-1">All newsletters you have generated, with their status and preview.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "generated", "proceeded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "generated" ? "Generated" : "Sent"}
              {f === "all" && (
                <span className="ml-1.5 text-gray-400">{history.length}</span>
              )}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">
            {filter === "all" ? "No newsletters generated yet." : `No ${filter === "proceeded" ? "sent" : "generated-only"} newsletters.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <HistoryCard key={item.id} item={item} onRemove={() => removeEntry(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
