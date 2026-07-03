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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'student');

    if (profile?.role === 'admin') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setStudents(data || []);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!isAuthenticated) return null; 

  return (
    <main className="container mx-auto px-4 py-12 relative max-w-5xl">
      <button 
        onClick={handleLogout} 
        className="absolute top-4 left-4 p-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
      >
        🚪 Çıkış Yap
      </button>

      <ThemeToggle />

      <header className="text-center mb-10 space-y-2 mt-8 md:mt-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-purple-400">
          Closed-Loop Coaching Hub
        </h1>
        <p className="text-sm text-gray-400">
          {userRole === 'admin' ? 'Yönetici Paneli' : 'Öğrenci Paneli'}
        </p>
      </header>

      <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'lg:grid-cols-2' : ''} gap-8 items-start`}>
        {userRole === 'admin' && (
          <div className="space-y-6">
            <NotificationForm students={students} />
          </div>
        )}

        <div className={userRole === 'student' ? 'max-w-2xl mx-auto w-full' : ''}>
          {/* students datasını içeri yolladık */}
          <DashboardTabs currentUserId={currentUser?.id} userRole={userRole} students={students} />
        </div>
      </div>

      {userRole === 'admin' && (
        <div className="mt-12">
          <AdminUserManagement students={students} />
        </div>
      )}
    </main>
  );
}