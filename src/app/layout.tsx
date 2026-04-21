import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServicesProvider } from "@/context/ServicesContext";
import { CampaignProvider } from "@/context/CampaignContext";
import { NewsletterHistoryProvider } from "@/context/NewsletterHistoryContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newsletter Dashboard",
  description: "Manage and generate newsletters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ServicesProvider>
          <CampaignProvider>
            <NewsletterHistoryProvider>{children}</NewsletterHistoryProvider>
          </CampaignProvider>
        </ServicesProvider>
      </body>
    </html>
  );
}
