import DashboardLayout from "@/components/layout/DashboardLayout";
import { NewsletterProvider } from "@/context/NewsletterContext";

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewsletterProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </NewsletterProvider>
  );
}
