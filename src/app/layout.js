import "@/app/globals.css";

export const metadata = {
  title: "Closed-Loop Coaching Hub",
  description: "Özel Koçluk Yönetim Sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}