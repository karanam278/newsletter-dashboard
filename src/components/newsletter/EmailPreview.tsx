"use client";

interface NewsletterData {
  subjectLine?: string;
  preheader?: string;
  headerTitle?: string;
  intro?: string;
  mainStory?: string;
  keyInsights?: string;
  industryUpdate?: string;
  proTip?: string;
  callToAction?: string;
  closing?: string;
  footerNote?: string;
}

function formatText(text: string) {
  return text.replace(/\\n/g, "\n").trim();
}

function parseMainStory(text: string) {
  const lines = formatText(text).split("\n").filter(Boolean);
  const titleLine = lines.find((l) => l.toLowerCase().startsWith("title:"));
  const title = titleLine ? titleLine.replace(/^title:\s*/i, "") : null;
  const body = lines.filter((l) => l !== titleLine).join("\n");
  return { title, body };
}

function parseBullets(text: string) {
  const lines = formatText(text).split("\n").filter(Boolean);
  const titleLine = lines.find((l) => l.toLowerCase().startsWith("title:"));
  const title = titleLine ? titleLine.replace(/^title:\s*/i, "") : null;
  const bullets = lines
    .filter((l) => l !== titleLine)
    .map((l) => l.replace(/^[→•📌]\s*/, "").trim())
    .filter(Boolean);
  return { title, bullets };
}

export default function EmailPreview({ data }: { data: NewsletterData }) {
  const mainStory = data.mainStory ? parseMainStory(data.mainStory) : null;
  const keyInsights = data.keyInsights ? parseBullets(data.keyInsights) : null;
  const industryUpdate = data.industryUpdate ? parseBullets(data.industryUpdate) : null;

  return (
    <div className="font-sans text-gray-800 bg-gray-100 rounded-xl overflow-hidden">

      {/* Email client chrome */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-1">
        {data.subjectLine && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">Subject</span>
            <span className="text-sm font-semibold text-gray-900">{formatText(data.subjectLine)}</span>
          </div>
        )}
        {data.preheader && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">Preview</span>
            <span className="text-xs text-gray-500 italic">{formatText(data.preheader)}</span>
          </div>
        )}
      </div>

      {/* Email body */}
      <div className="bg-gray-100 px-4 py-6">
        <div className="max-w-xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm">

          {/* Header banner */}
          {data.headerTitle && (
            <div className="bg-indigo-600 px-8 py-8 text-center">
              <p className="text-indigo-200 text-xs uppercase tracking-widest mb-2">Newsletter</p>
              <h1 className="text-white text-xl font-bold leading-snug">
                {formatText(data.headerTitle)}
              </h1>
            </div>
          )}

          <div className="px-8 py-6 space-y-6">

            {/* Intro */}
            {data.intro && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {formatText(data.intro)}
              </p>
            )}

            {/* Main Story */}
            {mainStory && (
              <div className="border-l-4 border-indigo-500 pl-4">
                {mainStory.title && (
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-1">
                    {mainStory.title}
                  </p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {mainStory.body}
                </p>
              </div>
            )}

            {/* Key Insights */}
            {keyInsights && keyInsights.bullets.length > 0 && (
              <div className="bg-indigo-50 rounded-xl p-5">
                {keyInsights.title && (
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-3">
                    {keyInsights.title}
                  </p>
                )}
                <ul className="space-y-2">
                  {keyInsights.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Industry Update */}
            {industryUpdate && industryUpdate.bullets.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                {industryUpdate.title && (
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                    {industryUpdate.title}
                  </p>
                )}
                <ul className="space-y-2">
                  {industryUpdate.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-500 font-bold shrink-0">📌</span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pro Tip */}
            {data.proTip && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <span className="text-xl shrink-0">💡</span>
                <p className="text-sm text-yellow-800 leading-relaxed whitespace-pre-line">
                  {formatText(data.proTip).replace(/^💡\s*(Pro Tip:?\s*)?/i, "")}
                </p>
              </div>
            )}

            {/* Call to Action */}
            {data.callToAction && (
              <div className="text-center py-2">
                <span className="inline-block bg-indigo-600 text-white text-sm font-semibold px-8 py-3 rounded-full">
                  {formatText(data.callToAction)}
                </span>
              </div>
            )}

            {/* Closing */}
            {data.closing && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-4">
                {formatText(data.closing)}
              </p>
            )}
          </div>

          {/* Footer */}
          {data.footerNote && (
            <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                {formatText(data.footerNote)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
