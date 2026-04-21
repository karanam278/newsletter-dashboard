"use client";

import { useState } from "react";
import { useCampaigns, Campaign } from "@/context/CampaignContext";

const SUBSCRIBER_OPTIONS = ["50", "150", "200", "All Subscribers"];
const DAILY_LIMIT_OPTIONS = [30, 40, 50, 60, 70, 80, 90, 100];

type Status = "idle" | "loading" | "success" | "error";

export default function CreateCampaign() {
  const { history, addCampaign, clearHistory } = useCampaigns();

  const [templateId, setTemplateId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastCampaignId, setLastCampaignId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const canSubmit =
    templateId.trim() && campaignName.trim() && subscribers && dailyLimit !== "";

  const handleCreate = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_CAMPAIGN_WEBHOOK_URL || "";

      let campaignId = "";

      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: templateId.trim(),
            campaignName: campaignName.trim(),
            subscribers,
            dailyLimit,
          }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw[0] : raw;
        campaignId =
          data?.["campaign id"] ||
          data?.campaignId ||
          data?.campaign_id ||
          data?.id ||
          "";
      }

      const campaign: Campaign = {
        campaignId,
        campaignName: campaignName.trim(),
        templateId: templateId.trim(),
        subscribers,
        dailyLimit: dailyLimit as number,
        createdAt: new Date().toISOString(),
      };

      addCampaign(campaign);
      setLastCampaignId(campaignId);
      setStatus("success");

      // reset form
      setTemplateId("");
      setCampaignName("");
      setSubscribers("");
      setDailyLimit("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-500 mt-1">Configure and launch your newsletter campaign.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">

          {/* Template ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="e.g. 52a6e7da-79b9-4bdd-88a2-3fc41f22ad6f"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Hair Transplant — April 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Subscribers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscribers <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={subscribers}
                onChange={(e) => setSubscribers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-8"
              >
                <option value="" disabled>Select subscriber count</option>
                {SUBSCRIBER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt === "All Subscribers" ? "All Subscribers" : `${opt} Subscribers`}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Send Limit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-8"
              >
                <option value="" disabled>Select daily limit</option>
                {DAILY_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} emails / day</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!canSubmit || status === "loading"}
            className="w-full py-3 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating Campaign...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Create Campaign
              </>
            )}
          </button>

          {/* Success banner */}
          {status === "success" && lastCampaignId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-green-800">Campaign created!</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Campaign ID</p>
                  <p className="text-sm font-mono font-medium text-gray-900 break-all">{lastCampaignId}</p>
                </div>
                <button
                  onClick={() => handleCopyId(lastCampaignId)}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copy campaign ID"
                >
                  {copiedId === lastCampaignId ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success banner (no id) */}
          {status === "success" && !lastCampaignId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-semibold text-green-800">Campaign created successfully!</p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium">Failed to create campaign</p>
              <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Campaign History
              <span className="ml-2 text-xs font-normal text-gray-400">({history.length})</span>
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto max-h-[60vh]">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-16">
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No campaigns yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{c.campaignName}</p>
                      <span className="shrink-0 text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {c.subscribers === "All Subscribers" ? "All Subscribers" : `${c.subscribers} subs`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {c.dailyLimit}/day
                      </span>
                    </div>

                    {c.campaignId && (
                      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Campaign ID</p>
                          <p className="text-xs font-mono text-gray-700 truncate">{c.campaignId}</p>
                        </div>
                        <button
                          onClick={() => handleCopyId(c.campaignId)}
                          className="shrink-0 ml-2 p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Copy campaign ID"
                        >
                          {copiedId === c.campaignId ? (
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
