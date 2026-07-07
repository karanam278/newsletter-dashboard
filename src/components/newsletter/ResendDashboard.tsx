"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";

const EVENT_TYPES = [
  { key: "all", label: "All Events" },
  { key: "sent", label: "Sent", color: "#6366f1" },
  { key: "delivered", label: "Delivered", color: "#22c55e" },
  { key: "opened", label: "Opened", color: "#3b82f6" },
  { key: "clicked", label: "Clicked", color: "#a855f7" },
  { key: "bounced", label: "Bounced", color: "#f87171" },
  { key: "complained", label: "Complained", color: "#eab308" },
  { key: "unsubscribed", label: "Unsubscribed", color: "#f97316" },
  { key: "delivery_delayed", label: "Delivery Delayed", color: "#9ca3af" },
  { key: "failed", label: "Failed", color: "#ef4444" },
  { key: "suppressed", label: "Suppressed", color: "#6b7280" },
];

const DATE_RANGES = [
  { label: "Today", days: 1 },
  { label: "Yesterday", days: 2 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 15 days", days: 15 },
  { label: "Last 30 days", days: 30 },
];

const ACTIVE_LINES = EVENT_TYPES.filter((e) => e.key !== "all") as {
  key: string;
  label: string;
  color: string;
}[];

const DELIVERED_EVENTS = new Set(["delivered", "opened", "clicked", "unsubscribed", "complained"]);

type ChartEntry = { date: string; ts: number } & Record<string, number | string>;

interface Stats {
  total: number;
  delivered: number;
  bounced: number;
  deliverabilityRate: number;
  eventCounts: Record<string, number>;
  chartData: ChartEntry[];
}

function computeStats(fullChart: ChartEntry[], days: number): Stats {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const sinceTs = since.getTime();

  const chartData = fullChart.filter((e) => e.ts >= sinceTs);

  const eventCounts: Record<string, number> = {};
  for (const day of chartData) {
    for (const [key, val] of Object.entries(day)) {
      if (key !== "date" && key !== "ts" && typeof val === "number") {
        eventCounts[key] = (eventCounts[key] || 0) + val;
      }
    }
  }

  const delivered = Object.entries(eventCounts)
    .filter(([k]) => DELIVERED_EVENTS.has(k))
    .reduce((sum, [, v]) => sum + v, 0);
  const bounced = eventCounts["bounced"] || 0;
  // Exclude suppressed/failed — those were never actually sent, Resend doesn't count them
  const NOT_SENT = new Set(["suppressed", "failed"]);
  const total = Object.entries(eventCounts)
    .filter(([k]) => !NOT_SENT.has(k))
    .reduce((sum, [, v]) => sum + v, 0);
  const deliverabilityRate = total > 0 ? +((delivered / total) * 100).toFixed(2) : 0;

  return { total, delivered, bounced, deliverabilityRate, eventCounts, chartData };
}

const CACHE_KEY = "resend_full_chart";
const CACHE_TTL = 5 * 60 * 1000;

function getCached(): ChartEntry[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data: ChartEntry[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

export default function ResendDashboard() {
  const [fullChart, setFullChart] = useState<ChartEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/supabase/newsletter-campaigns").then((r) => r.json()),
      fetch("/api/supabase/lead-counts").then((r) => r.json()),
    ])
      .then(([campaignsData, leadCountsData]) => {
        if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
        if (!leadCountsData.error) setLeadCounts(leadCountsData || {});
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback((force = false) => {
    if (!force) {
      const cached = getCached();
      if (cached) { setFullChart(cached); return; }
    }
    setFullChart(null);
    setLoading(true);
    setError("");
    fetch("/api/resend/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else { setFullChart(data.chartData); setCache(data.chartData); }
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Instant client-side filtering — no API call when switching date ranges
  const stats = useMemo(
    () => (fullChart ? computeStats(fullChart, selectedDays) : null),
    [fullChart, selectedDays]
  );

  const visibleLines =
    selectedEvent === "all"
      ? ACTIVE_LINES.filter((e) => stats?.eventCounts?.[e.key])
      : ACTIVE_LINES.filter((e) => e.key === selectedEvent);

  const selectedEventLabel =
    EVENT_TYPES.find((e) => e.key === selectedEvent)?.label || "All Events";

  const selectedDateLabel =
    DATE_RANGES.find((r) => r.days === selectedDays)?.label || "Last 30 days";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading analytics...
      </div>
    );
  }

  if (error) {
    const isRateLimit = error.includes("429");
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">
            {isRateLimit
              ? "Resend API rate limit hit. Wait a moment and click Retry."
              : <>Make sure <code className="bg-red-100 px-1 rounded">RESEND_API_KEY</code> is set in your environment variables.</>}
          </p>
          <button
            onClick={() => fetchData(true)}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Analytics</h1>
          <p className="text-gray-500 mt-1">
            Resend delivery stats for{" "}
            <span className="font-medium text-gray-700">health.togahh.com</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Refresh data"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
            >
              {selectedDateLabel}
              <svg className={`w-4 h-4 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.days}
                    onClick={() => { setSelectedDays(r.days); setDateDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${selectedDays === r.days ? "text-indigo-600 font-medium" : "text-gray-700"}`}
                  >
                    {r.label}
                    {selectedDays === r.days && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Emails */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Emails</p>
            <span className="bg-indigo-100 p-2 rounded-xl">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{stats?.total ?? 0}</p>
        </div>

        {/* Delivered */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Delivered</p>
            <span className="bg-emerald-100 p-2 rounded-xl">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats?.delivered ?? 0}</p>
        </div>

        {/* Bounced — with bounce rate */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bounced</p>
            <span className="bg-red-100 p-2 rounded-xl">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-red-600">{stats?.bounced ?? 0}</p>
            {(stats?.total ?? 0) > 0 && (
              <span className="mb-1 text-sm font-semibold text-red-400">
                {(((stats?.bounced ?? 0) / (stats?.total ?? 1)) * 100).toFixed(1)}% bounce rate
              </span>
            )}
          </div>
        </div>

        {/* Deliverability */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Deliverability</p>
            <span className="bg-violet-100 p-2 rounded-xl">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-violet-700">{stats?.deliverabilityRate ?? 0}%</p>
        </div>
      </div>

      {/* Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-gray-700">Events Over Time</p>
            <div className="relative">
              <button
                onClick={() => setEventDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectedEventLabel}
                <svg className={`w-4 h-4 transition-transform ${eventDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {eventDropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                  {EVENT_TYPES.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => { setSelectedEvent(e.key); setEventDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${selectedEvent === e.key ? "text-indigo-600 font-medium" : "text-gray-700"}`}
                    >
                      {"color" in e ? (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                      ) : (
                        <span className="w-2.5 h-2.5 shrink-0" />
                      )}
                      {e.label}
                      {selectedEvent === e.key && (
                        <svg className="w-4 h-4 ml-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.chartData || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#f9fafb", fontSize: "12px" }}
                labelStyle={{ color: "#d1d5db", marginBottom: "4px" }}
              />
              {visibleLines.map((line) => (
                <Line key={line.key} type="linear" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-4 justify-end">
            {visibleLines.map((line) => (
              <div key={line.key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: line.color }} />
                <span className="text-xs text-gray-500">{line.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Event Distribution</p>
          {stats?.eventCounts && Object.keys(stats.eventCounts).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ACTIVE_LINES.filter((e) => stats.eventCounts[e.key]).map((e) => ({
                      name: e.label,
                      value: stats.eventCounts[e.key],
                      fill: e.color,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#f9fafb", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {ACTIVE_LINES.filter((e) => stats.eventCounts[e.key]).map((e) => {
                  const count = stats.eventCounts[e.key];
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={e.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                        <span className="text-gray-600">{e.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{count}</span>
                        <span className="text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Currently Running Newsletters */}
      {(() => {
        const activeCampaigns = campaigns
          .map((c) => {
            const table = String(c.subscribers || "");
            const leads = leadCounts[table] ?? 0;
            const dailySent = Number(c.daily_limit || 0);
            const daysToComplete = dailySent > 0 ? Math.ceil(leads / dailySent) : 0;
            const completionLabel = dailySent > 0
              ? new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : null;
            return {
              id: String(c.id),
              title: String(c.campaign_name || c.subject_line || "—"),
              templateId: String(c.template_id || ""),
              table,
              leads,
              dailySent,
              daysToComplete,
              completionLabel,
              isCompleted: leads <= 0,
            };
          })
          .filter((c) => !c.isCompleted);

        return (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-semibold text-gray-700">Currently Running Newsletters</p>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activeCampaigns.length} active</span>
            </div>

            {activeCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-gray-500 mb-3">No newsletters are currently running.</p>
                <Link
                  href="/newsletter/campaign"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  + Create a campaign
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                  >
                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-800 leading-snug mb-3 line-clamp-2">
                      {c.title}
                    </p>

                    {/* Template ID */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="text-xs font-mono text-gray-500 truncate" title={c.templateId}>
                        {c.templateId.slice(0, 8)}…{c.templateId.slice(-4)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {c.leads.toLocaleString()} leads · {c.table}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {c.dailySent}/day · ~{c.daysToComplete}d left · ~{c.completionLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
