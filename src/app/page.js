'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationForm } from "@/components/NotificationForm";
import { DashboardTabs } from "@/components/DashboardTabs";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser(session.user);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    setUserRole(profile?.role || 'student');

    if (profile?.role === 'admin') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setStudents(data || []);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!isAuthenticated) return null; 

  return (
    <main className="container mx-auto px-4 sm:px-6 py-12 relative max-w-6xl">
      <div className="absolute top-4 left-4 flex gap-2">
        {/* AKILLI BUTON: Adminse Kullanıcı Yönetimi, Öğrenciyse Profilim */}
        {userRole === 'admin' ? (
          <button onClick={() => router.push('/users')} className="p-2 text-sm font-bold text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-all flex items-center gap-2">
            👥 <span className="hidden sm:inline">Kullanıcı Yönetimi</span>
          </button>
        ) : (
          <button onClick={() => router.push('/profile')} className="p-2 text-sm font-bold text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-all flex items-center gap-2">
            ⚙️ <span className="hidden sm:inline">Profilim</span>
          </button>
        )}
        
        <button onClick={handleLogout} className="p-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2">
          🚪 <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </div>

      <ThemeToggle />

      <header className="text-center mb-12 space-y-2 mt-12 md:mt-0">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-purple-400">
          Closed-Loop Coaching Hub
        </h1>
        <p className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {userRole === 'admin' ? 'Yönetici Paneli' : 'Öğrenci Paneli'}
        </p>
      </header>

      <div className={`flex flex-col lg:flex-row gap-8 items-start`}>
        
        {/* Sol Sütun: Bildirim Gönder (Sadece Admin) */}
        {userRole === 'admin' && (
          <div className="w-full lg:w-1/3 space-y-6">
            <NotificationForm students={students} />
          </div>
        )}

        {/* Sağ Sütun: Sekmeler ve İçerik (Herkes görür) */}
        <div className={`w-full ${userRole === 'admin' ? 'lg:w-2/3' : 'max-w-3xl mx-auto'}`}>
          <DashboardTabs currentUserId={currentUser?.id} userRole={userRole} students={students} />
        </div>
      </div>
    </main>
  );
}