'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';

export function AdminUserManagement({ students }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [studentData, setStudentData] = useState({ weights: [], macros: [], poses: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Öğrenci seçildiğinde verilerini çek
  useEffect(() => {
    if (!selectedStudent) return;

    const fetchStudentDetails = async () => {
      setIsLoading(true);
      
      // Kilo ve Form verileri
      const { data: formChecks } = await supabase
        .from('form_checks')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('created_at', { ascending: false });

      // Günlük Makro Raporları
      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('log_date', { ascending: false })
        .limit(14); // Son 14 günün verisi

      // Grafikler için veriyi formatla (Eskiden yeniye doğru sırala)
      const weightChartData = (formChecks || []).map(fc => ({
        date: new Date(fc.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        kilo: fc.current_weight
      })).reverse();

      const macroChartData = (dailyLogs || []).map(log => ({
        date: new Date(log.log_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        Protein: log.macros?.protein || 0,
        Karb: log.macros?.carb || 0,
        Yag: log.macros?.fat || 0
      })).reverse();

      setStudentData({
        weights: weightChartData,
        macros: macroChartData,
        poses: formChecks || []
      });
      setIsLoading(false);
    };

    fetchStudentDetails();
  }, [selectedStudent]);

  const openDrawer = (student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
    // Arkadaki sayfanın kaymasını engelle
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    document.body.style.overflow = 'auto';
    setTimeout(() => setSelectedStudent(null), 300); // Animasyon bitene kadar bekle
  };

  const adminStudents = students?.filter(s => s.role !== 'admin') || [];

  return (
    <div>
      <h3 className="text-xl font-black text-gray-800 dark:text-zinc-200 mb-6">Öğrenci Portföyü</h3>
      
      {/* Öğrenci Listesi Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {adminStudents.map(student => (
          <div 
            key={student.id} 
            onClick={() => openDrawer(student)}
            className="p-5 bg-white dark:bg-[#16161d] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-brand-purple dark:hover:border-brand-purple transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-lg">
                {student.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-zinc-200 group-hover:text-brand-purple transition-colors">
                  {student.full_name}
                </h4>
                <p className="text-xs text-gray-500">{student.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- SLIDE-OVER DRAWER (SAĞDAN AÇILAN PANEL) --- */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Karanlık Arkaplan (Backdrop) */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />

        {/* Panel İçeriği */}
        <div className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-slate-50 dark:bg-[#0f0f12] shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {selectedStudent && (
            <div className="p-6 md:p-8 space-y-8 pb-24">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b dark:border-zinc-800">
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-purple-500">
                    {selectedStudent.full_name}
                  </h2>
                  <p className="text-sm text-gray-500">Gelişim ve İstatistik Paneli</p>
                </div>
                <button onClick={closeDrawer} className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                  ✕
                </button>
              </div>

              {isLoading ? (
                <div className="animate-pulse flex flex-col gap-6">
                  <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-2xl w-full"></div>
                  <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-2xl w-full"></div>
                </div>
              ) : (
                <>
                  {/* Kilo Trendi Grafiği */}
                  <div className="bg-white dark:bg-[#16161d] p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Kilo Değişim Trendi</h3>
                    <div className="h-64 w-full">
                      {studentData.weights.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={studentData.weights} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                            <Tooltip contentStyle={{ backgroundColor: '#16161d', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }} />
                            <Line type="monotone" dataKey="kilo" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">Yeterli veri yok.</div>
                      )}
                    </div>
                  </div>

                  {/* Makro Alımı Grafiği */}
                  <div className="bg-white dark:bg-[#16161d] p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Son 14 Günlük Makro Alımı</h3>
                    <div className="h-72 w-full">
                      {studentData.macros.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={studentData.macros} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#16161d', border: '1px solid #27272a', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                            <Bar dataKey="Protein" stackId="a" fill="#8b5cf6" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="Karb" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="Yag" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">Yeterli veri yok.</div>
                      )}
                    </div>
                  </div>

                  {/* Son Yüklenen Form Fotoğrafı */}
                  {studentData.poses.length > 0 && (
                    <div className="bg-white dark:bg-[#16161d] p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                      <h3 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Son Podyum / Form Görseli</h3>
                      <div className="relative aspect-square w-full md:w-1/2 rounded-2xl overflow-hidden border-2 border-brand-purple">
                        <img 
                          src={studentData.poses[0].front_pose_url} 
                          alt="Güncel Form" 
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white font-bold">{studentData.poses[0].current_weight} kg</p>
                          <p className="text-xs text-gray-300">{new Date(studentData.poses[0].created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}