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
  const [studentData, setStudentData] = useState({ macros: [], poses: [] });
  const [isLoading, setIsLoading] = useState(false);
  
  // Grafik Zaman Filtresi State'i ('week', 'month', 'all')
  const [weightChartPeriod, setWeightChartPeriod] = useState('month');

  useEffect(() => {
    if (!selectedStudent) return;

    const fetchStudentDetails = async () => {
      setIsLoading(true);
      
      const { data: formChecks } = await supabase
        .from('form_checks')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('created_at', { ascending: false });

      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .order('log_date', { ascending: false })
        .limit(14);

      const macroChartData = (dailyLogs || []).map(log => ({
        date: new Date(log.log_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        Protein: log.macros?.protein || 0,
        Karb: log.macros?.carb || 0,
        Yag: log.macros?.fat || 0
      })).reverse();

      setStudentData({
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
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    document.body.style.overflow = 'auto';
    setTimeout(() => setSelectedStudent(null), 300);
  };

  // Kilo Grafiği İçin Dinamik Veri Filtreleme
  const getFilteredWeightData = () => {
    if (!studentData.poses || studentData.poses.length === 0) return [];
    
    const now = new Date();
    let cutoffDate = new Date(0); // 'all' için varsayılan (1970)

    if (weightChartPeriod === 'week') {
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
    } else if (weightChartPeriod === 'month') {
      cutoffDate = new Date(now.setDate(now.getDate() - 30));
    }

    return studentData.poses
      .filter(pose => new Date(pose.created_at) >= cutoffDate)
      .map(pose => ({
        date: new Date(pose.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        kilo: pose.current_weight
      }))
      .reverse(); // Eskiden yeniye sırala
  };

  const activeWeightData = getFilteredWeightData();
  const adminStudents = students?.filter(s => s.role !== 'admin') || [];

  return (
    <div>
      <h3 className="text-xl font-black text-gray-800 dark:text-zinc-200 mb-6">Öğrenci Portföyü</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {adminStudents.map(student => (
          <div 
            key={student.id} 
            onClick={() => openDrawer(student)}
            className="p-5 bg-white dark:bg-[#16161d] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-brand-purple dark:hover:border-brand-purple transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-lg overflow-hidden border border-brand-purple/20">
                 {student.avatar_url ? (
                    <img src={student.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    student.full_name?.charAt(0).toUpperCase()
                 )}
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

      {/* --- SLIDE-OVER DRAWER --- */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />

        <div className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-slate-50 dark:bg-[#0f0f12] shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {selectedStudent && (
            <div className="p-6 md:p-8 space-y-8 pb-24">
              
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
                  {/* DİNAMİK KİLO TRENDİ GRAFİĞİ */}
                  <div className="bg-white dark:bg-[#16161d] p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Kilo Değişim Trendi</h3>
                      
                      {/* Zaman Filtresi Butonları */}
                      <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg">
                        <button 
                          onClick={() => setWeightChartPeriod('week')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${weightChartPeriod === 'week' ? 'bg-white dark:bg-zinc-700 text-brand-purple shadow-sm' : 'text-gray-500'}`}
                        >
                          1 Hafta
                        </button>
                        <button 
                          onClick={() => setWeightChartPeriod('month')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${weightChartPeriod === 'month' ? 'bg-white dark:bg-zinc-700 text-brand-purple shadow-sm' : 'text-gray-500'}`}
                        >
                          1 Ay
                        </button>
                        <button 
                          onClick={() => setWeightChartPeriod('all')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${weightChartPeriod === 'all' ? 'bg-white dark:bg-zinc-700 text-brand-purple shadow-sm' : 'text-gray-500'}`}
                        >
                          Tümü
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      {activeWeightData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeWeightData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ backgroundColor: '#16161d', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }} />
                            <Line type="monotone" dataKey="kilo" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500 bg-gray-50 dark:bg-zinc-900/50 rounded-xl">
                          Bu tarih aralığında form verisi bulunamadı.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MAKRO ALIMI GRAFİĞİ */}
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

                  {/* PROGRAM YAZMA MERKEZİ */}
                  <div className="grid grid-cols-1 gap-6 pt-6 border-t dark:border-zinc-800">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-purple uppercase tracking-wider">Beslenme Programı (Admin Editörü)</label>
                      <textarea 
                        defaultValue={selectedStudent.nutrition_plan}
                        id={`nutrition-${selectedStudent.id}`}
                        placeholder="Örn: 3000 Kalori - 250g P, 300g C, 60g F..."
                        className="w-full h-32 p-4 rounded-xl border dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-brand-purple"
                      />
                      <button 
                        onClick={async () => {
                          const val = document.getElementById(`nutrition-${selectedStudent.id}`).value;
                          await supabase.from('profiles').update({ nutrition_plan: val }).eq('id', selectedStudent.id);
                          alert('Beslenme programı kaydedildi!');
                        }}
                        className="w-full py-3 bg-zinc-800 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-bold rounded-xl text-sm transition-all"
                      >
                        Beslenmeyi Kaydet
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Antrenman Programı (Admin Editörü)</label>
                      <textarea 
                        defaultValue={selectedStudent.workout_plan}
                        id={`workout-${selectedStudent.id}`}
                        placeholder="Örn: Classic Physique Hipertrofi Bloğu - Push/Pull/Legs..."
                        className="w-full h-32 p-4 rounded-xl border dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        onClick={async () => {
                          const val = document.getElementById(`workout-${selectedStudent.id}`).value;
                          await supabase.from('profiles').update({ workout_plan: val }).eq('id', selectedStudent.id);
                          alert('Antrenman programı kaydedildi!');
                        }}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all"
                      >
                        Antrenmanı Kaydet
                      </button>
                    </div>
                  </div>

                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}