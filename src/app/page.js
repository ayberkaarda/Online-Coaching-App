'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationForm } from "@/components/NotificationForm";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { DashboardTabs } from "@/components/DashboardTabs";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // GÜVENLİK DUVARI: Session yoksa Login'e gönder
    if (!session) {
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);

    // Giriş başarılıysa verileri çek
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setStudents(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Doğrulama bitene kadar boş ekran veya loading gösterir, içeriği sızdırmaz
  if (!isAuthenticated) return null; 

  return (
    <main className="container mx-auto px-4 sm:px-6 py-12 relative max-w-6xl">
      <div className="absolute top-4 left-4 flex gap-2">
        <button onClick={() => router.push('/profile')} className="p-2 text-sm font-bold text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-all flex items-center gap-2">
          ⚙️ <span className="hidden sm:inline">Profilim</span>
        </button>
        <button onClick={handleLogout} className="p-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2">
          🚪 <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </div>
      <ThemeToggle />

      <header className="text-center mb-10 space-y-2 mt-8 md:mt-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-purple-400">
          Closed-Loop Coaching Hub
        </h1>
        <p className="text-sm text-gray-400">Özel Koçluk Yönetimi</p>
      </header>

      {/* Grid Mimarisi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <NotificationForm students={students} />
        </div>
        <div>
          <DashboardTabs />
        </div>
      </div>

      <div className="mt-12">
        <AdminUserManagement students={students} />
      </div>
    </main>
  );
}