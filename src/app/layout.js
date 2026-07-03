import "@/app/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Closed-Loop Coaching Hub",
  description: "Özel Koçluk Yönetim Sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#0f0f12] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}