import { ThemeProvider } from "@/components/ThemeProvider";
import "@/app/globals.css"; // Standart Tailwind CSS importu

export const metadata = {
  title: "Kapalı Devre Koçluk Sistemi",
  description: "Next.js & Supabase Premium Coaching Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-brand-darkBg dark:text-zinc-100 min-h-screen transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}