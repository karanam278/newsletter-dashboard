"use client";

import { useState } from "react";
import { useServices } from "@/context/ServicesContext";
import { useNewsletter, NewsletterData } from "@/context/NewsletterContext";
import { useNewsletterHistory } from "@/context/NewsletterHistoryContext";
import EmailPreview from "./EmailPreview";

const SECTIONS: { key: keyof NewsletterData; label: string }[] = [
  { key: "subjectLine",    label: "Subject Line"    },
  { key: "preheader",      label: "Preheader"       },
  { key: "headerTitle",    label: "Header Title"    },
  { key: "intro",          label: "Introduction"    },
  { key: "mainStory",      label: "Main Story"      },
  { key: "keyInsights",    label: "Key Insights"    },
  { key: "industryUpdate", label: "Industry Update" },
  { key: "proTip",         label: "Pro Tip"         },
  { key: "callToAction",   label: "Call to Action"  },
  { key: "closing",        label: "Closing"         },
  { key: "footerNote",     label: "Footer Note"     },
];

function formatText(text: string) {
  return text.replace(/\\n/g, "\n").trim();
}

function parseResponse(raw: unknown): NewsletterData | null {
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data || typeof data !== "object") return null;
  const hasStructuredFields = SECTIONS.some(({ key }) => key in (data as object));
  return hasStructuredFields ? (data as NewsletterData) : null;
}

export default function GenerateNewsletter() {
  const { services } = useServices();
  const {
    selectedService, setSelectedService,
    topic, setTopic,
    status, setStatus,
    newsletter, setNewsletter,
    rawFallback, setRawFallback,
    errorMessage, setErrorMessage,
    retryPrompt, setRetryPrompt,
    templateId, setTemplateId,
    reset,
  } = useNewsletter();

  const { addEntry } = useNewsletterHistory();
  const [copied, setCopied] = useState(false);

  const applyResponse = (raw: unknown) => {
    const structured = parseResponse(raw);
    if (structured) {
      setNewsletter(structured);
      setRawFallback("");
    } else {
      const data = Array.isArray(raw) ? raw[0] : raw as NewsletterData;
      const fallback = data?.output || data?.content || data?.newsletter;
      setRawFallback(fallback ? formatText(fallback) : JSON.stringify(raw, null, 2));
      setNewsletter(null);
    }
  };

  const saveToHistory = (nl: NewsletterData | null, rb: string, tid: string, st: "generated" | "proceeded") => {
    addEntry({
      id: Date.now().toString(),
      service: selectedService,
      topic: topic.trim(),
      newsletter: nl,
      rawFallback: rb,
      templateId: tid,
      status: st,
    });
  };

  const handleGenerate = async () => {
    if (!selectedService || !topic.trim()) return;
    setStatus("loading");
    setNewsletter(null);
    setRawFallback("");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_GENERATE_WEBHOOK_URL || "";

      if (!webhookUrl) {
        await new Promise((r) => setTimeout(r, 1200));
        const mock: NewsletterData = {
          subjectLine: `Why Is Turkey the Top ${selectedService} Destination?`,
          preheader: `Discover what makes Turkey a premier choice for ${selectedService}.`,
          headerTitle: `Turkey: The Premier ${selectedService} Destination`,
          intro: `Hello, dear reader!\n\nAre you considering ${selectedService}? Today, we'll explore why Turkey stands out as the leading destination for this life-changing procedure.`,
          mainStory: `Title: The Science Behind Turkey's Popularity\n\nTurkey is home to over 48 JCI-accredited hospitals. Each year, thousands flock to Turkey for ${selectedService}, drawn by advanced techniques and experienced surgeons.`,
          keyInsights: `→ Comprehensive Care: Clinics provide consultations and post-treatment check-ups.\n→ Advanced Technology: Cutting-edge tools minimise recovery times.\n→ Competitive Pricing: World-class results at accessible prices.`,
          proTip: `💡 Pro Tip:\n\nResearch potential clinics thoroughly. Look for patient reviews and before-and-after photos.`,
          callToAction: `Get expert guidance for your ${selectedService} journey`,
          closing: `Thank you for reading.\n\nWarm regards,\nThe Team`,
          footerNote: `You're receiving this because you subscribed to our Health & Wellness Newsletter.`,
        };
        setNewsletter(mock);
        saveToHistory(mock, "", "", "generated");
        setStatus("success");
        return;
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: selectedService, topic: topic.trim() }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
      const raw = await res.json();
      applyResponse(raw);
      const structured = parseResponse(raw);
      saveToHistory(structured, structured ? "" : JSON.stringify(raw, null, 2), "", "generated");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleRegenerate = async () => {
    if (!retryPrompt.trim()) return;
    setStatus("regenerating");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_REGENERATE_WEBHOOK_URL || "";

      if (!webhookUrl) {
        await new Promise((r) => setTimeout(r, 1200));
        setNewsletter({ ...newsletter, intro: `[Regenerated based on: "${retryPrompt}"]\n\n` + (newsletter?.intro || "") });
        setRetryPrompt("");
        setStatus("success");
        return;
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService,
          topic: topic.trim(),
          retryPrompt: retryPrompt.trim(),
          previousContent: newsletter,
        }),
      });

      if (!res.ok) throw new Error(`Regeneration failed: ${res.statusText}`);
      const raw = await res.json();
      applyResponse(raw);
      setRetryPrompt("");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Regeneration failed");
      setStatus("error");
    }
  };

  const handleProceed = async () => {
    setStatus("proceeding");
    setErrorMessage("");
    setTemplateId("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_HTML_WEBHOOK_URL || "";
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newsletter, service: selectedService, topic: topic.trim() }),
        });
        if (!res.ok) throw new Error(`Failed to send: ${res.statusText}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw[0] : raw;
        const tid: string = data?.["template id"] || data?.templateId || data?.template_id || "";
        setTemplateId(tid);
        saveToHistory(newsletter, rawFallback, tid, "proceeded");
      }
      setStatus("proceeded");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send newsletter");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    const text = newsletter
      ? SECTIONS.filter(({ key }) => newsletter[key])
          .map(({ label, key }) => `[${label.toUpperCase()}]\n${formatText(newsletter[key]!)}`)
          .join("\n\n---\n\n")
      : rawFallback;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = status === "loading" || status === "regenerating" || status === "proceeding";
  const hasContent = (status === "success" || status === "rejected") && (newsletter || rawFallback);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Generate Newsletter</h1>
        <p className="text-gray-500 mt-1">Select a service and enter a topic to generate your newsletter.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {services.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedService === service
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${selectedService === service ? "bg-indigo-600" : "bg-gray-300"}`} />
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Newsletter Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Benefits of Hair Transplant in Turkey..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedService || !topic.trim() || isLoading}
            className="w-full py-3 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Generate Newsletter</>
            )}
          </button>
        </div>

        {/* Right: output */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Generated Content</h2>
            {hasContent && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  {copied
                    ? <><svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
                    : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                  }
                </button>
                <button onClick={reset} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto min-h-64 max-h-[60vh]">
            {status === "idle" && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Select a service and click Generate</p>
              </div>
            )}

            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <svg className="animate-spin w-8 h-8 mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm">
                  {status === "regenerating" ? "Regenerating your newsletter..." : status === "proceeding" ? "Sending newsletter..." : "Generating your newsletter..."}
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium">Failed</p>
                <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
              </div>
            )}

            {hasContent && newsletter && <EmailPreview data={newsletter} />}
            {hasContent && rawFallback && (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{rawFallback}</pre>
            )}
          </div>

          {status === "proceeded" && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Newsletter sent successfully!</p>
                  {templateId && (
                    <div className="mt-2 bg-white border border-green-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Template ID</p>
                        <p className="text-sm font-mono font-medium text-gray-900 break-all">{templateId}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(templateId); }}
                        className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={reset} className="w-full py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Generate another newsletter
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="border-t border-gray-100 pt-4 flex gap-3">
              <button
                onClick={handleProceed}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Proceed
              </button>
              <button
                onClick={() => setStatus("rejected")}
                className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </div>
          )}

          {status === "rejected" && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">What would you like to change?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Describe what to improve and we&apos;ll regenerate it.</p>
                </div>
              </div>
              <textarea
                value={retryPrompt}
                onChange={(e) => setRetryPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Make the tone more friendly, add more statistics, shorten the intro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={!retryPrompt.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
                <button
                  onClick={() => setStatus("success")}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
