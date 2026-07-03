'use client'

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

export function DashboardTabs({ currentUserId, userRole, students }) {
  const [activeTab, setActiveTab] = useState('formCheck');
  const exportRef = useRef(null);

  // Admin Kontrolü
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Veriler
  const [fetchedFormChecks, setFetchedFormChecks] = useState([]);
  const [fetchedDailyLogs, setFetchedDailyLogs] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState('');
  const [workoutPlan, setWorkoutPlan] = useState('');

  // Form State'leri
  const [isUploading, setIsUploading] = useState(false);
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [sodium, setSodium] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  const targetId = userRole === 'admin' ? selectedStudentId : currentUserId;

  // Verileri Çek
  useEffect(() => {
    if (!targetId) {
      setFetchedFormChecks([]); setFetchedDailyLogs([]); setNutritionPlan(''); setWorkoutPlan('');
      return;
    }

    const fetchData = async () => {
      // Form & Günlük
      if (activeTab === 'formCheck') {
        const { data } = await supabase.from('form_checks').select('*').eq('student_id', targetId).order('created_at', { ascending: false });
        setFetchedFormChecks(data || []);
      } else if (activeTab === 'daily') {
        const { data } = await supabase.from('daily_logs').select('*').eq('student_id', targetId).order('log_date', { ascending: false });
        setFetchedDailyLogs(data || []);
      }
      
      // Programlar (Her tab değişiminde çekilir ki güncel kalsın)
      const { data: profileData } = await supabase.from('profiles').select('nutrition_plan, workout_plan').eq('id', targetId).single();
      if (profileData) {
        setNutritionPlan(profileData.nutrition_plan || '');
        setWorkoutPlan(profileData.workout_plan || '');
      }
    };
    fetchData();
  }, [activeTab, targetId]);

  // Program Kaydetme (Sadece Admin)
  const handleSaveProgram = async (type) => {
    if (!selectedStudentId) return alert("Lütfen önce bir öğrenci seçin!");
    
    const updateData = type === 'nutrition' ? { nutrition_plan: nutritionPlan } : { workout_plan: workoutPlan };
    
    const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedStudentId);
    if (error) alert("Hata: " + error.message);
    else alert("Program başarıyla güncellendi!");
  };

  // Öğrenci Form Gönderimi
  const handleFileUpload = async (e) => {
    // ... (Önceki form yükleme kodlarının aynısı)
    e.preventDefault();
    if (!currentUserId || !weight) return alert("Kilo giriniz.");
    const file = e.target.poseImage.files[0];
    if (!file) return alert("Fotoğraf seçiniz.");

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('form-checks-media').upload(`poses/${fileName}`, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('form-checks-media').getPublicUrl(`poses/${fileName}`);

      await supabase.from('form_checks').insert([{
        student_id: currentUserId, current_weight: parseFloat(weight), front_pose_url: publicUrl, notes: "Yeni form"
      }]);

      alert("Form başarıyla iletildi!");
      e.target.reset(); setWeight('');
      const { data } = await supabase.from('form_checks').select('*').eq('student_id', currentUserId).order('created_at', { ascending: false });
      setFetchedFormChecks(data || []);
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Öğrenci Günlük Rapor Gönderimi
  const handleDailySubmit = async (e) => {
    e.preventDefault();
    await supabase.from('daily_logs').insert([{
      student_id: currentUserId, water_lt: parseFloat(water), sodium_mg: parseInt(sodium), macros: { protein, carb, fat }
    }]);
    alert("Günlük veriler kaydedildi!");
    setWater(''); setSodium(''); setProtein(''); setCarb(''); setFat('');
    const { data } = await supabase.from('daily_logs').select('*').eq('student_id', currentUserId).order('log_date', { ascending: false });
    setFetchedDailyLogs(data || []);
  };

  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `koçluk_${activeTab}.png`; link.click();
  };

  return (
    <div className="w-full mt-4">
      {userRole === 'admin' && (
        <div className="mb-6 p-4 md:p-5 bg-white dark:bg-[#16161d] rounded-2xl border border-brand-purple/20 shadow-sm">
          <label className="block text-xs font-bold text-brand-purple mb-2">ÖĞRENCİ SEÇ (PROGRAM YAZMAK VE İNCELEMEK İÇİN)</label>
          <select onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-3 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none focus:border-brand-purple transition-colors">
            <option value="">-- Öğrenci Seçiniz --</option>
            {students?.filter(s => s.role !== 'admin').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      )}

      {/* MOBİL UYUMLU KAYDIRILABİLİR SEKMELER */}
      <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-gray-200 dark:border-zinc-800 text-sm font-medium pb-2">
        {['formCheck', 'daily', 'nutrition', 'workout'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`pb-2 whitespace-nowrap transition-all relative ${activeTab === tab ? 'text-brand-purple font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            {tab === 'formCheck' && '📸 Form Check'}
            {tab === 'daily' && '📊 Günlük Veriler'}
            {tab === 'nutrition' && '🥗 Beslenme'}
            {tab === 'workout' && '🏋️ Antrenman'}
            {activeTab === tab && <span className="absolute bottom-[-9px] left-0 w-full h-[2px] bg-brand-purple" />}
          </button>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={handleDownloadImage} className="text-xs bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 px-3 py-2 rounded-lg font-bold transition-all">
          Görsel Olarak İndir
        </button>
      </div>

      <div ref={exportRef} className="mt-4 bg-white dark:bg-[#16161d] rounded-3xl p-5 md:p-8 border border-gray-100 dark:border-zinc-800 shadow-sm min-h-[400px]">
        
        {/* === BESLENME SEKMESİ === */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-3">Güncel Beslenme Programı</h4>
            {userRole === 'admin' ? (
              <div className="space-y-3">
                <textarea 
                  value={nutritionPlan} 
                  onChange={(e) => setNutritionPlan(e.target.value)} 
                  placeholder="Örn: 3000 Kalori - 250g Protein, 300g Karb, 60g Yağ..." 
                  className="w-full h-48 p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none"
                />
                <button onClick={() => handleSaveProgram('nutrition')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all">
                  Beslenme Programını Güncelle
                </button>
              </div>
            ) : (
              <div className="p-5 bg-gray-50 dark:bg-zinc-950 rounded-2xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {nutritionPlan || "Koçunuz henüz bir beslenme programı atamadı."}
              </div>
            )}
          </div>
        )}

        {/* === ANTRENMAN SEKMESİ === */}
        {activeTab === 'workout' && (
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-3">Güncel Antrenman Programı</h4>
            {userRole === 'admin' ? (
              <div className="space-y-3">
                <textarea 
                  value={workoutPlan} 
                  onChange={(e) => setWorkoutPlan(e.target.value)} 
                  placeholder="Örn: Push/Pull/Legs Split. Push Günü: Incline Dumbbell Press 4x10..." 
                  className="w-full h-48 p-4 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none"
                />
                <button onClick={() => handleSaveProgram('workout')} className="w-full py-3 bg-brand-purple hover:bg-brand-purpleHover text-white font-bold rounded-xl text-sm transition-all">
                  Antrenman Programını Güncelle
                </button>
              </div>
            ) : (
              <div className="p-5 bg-gray-50 dark:bg-zinc-950 rounded-2xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {workoutPlan || "Koçunuz henüz bir antrenman programı atamadı."}
              </div>
            )}
          </div>
        )}

        {/* === FORM CHECK SEKMESİ === */}
        {activeTab === 'formCheck' && (
          <div className="space-y-6">
            {userRole === 'student' && (
               <form onSubmit={handleFileUpload} className="space-y-4 border-b dark:border-zinc-800 pb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">GÜNCEL KİLO</label>
                      <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required className="w-full p-3 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none" />
                    </div>
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">PODYUM / FORM</label>
                      <input type="file" name="poseImage" accept="image/*" required className="w-full text-xs text-gray-500 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-brand-purple/10 file:text-brand-purple file:font-bold cursor-pointer" />
                    </div>
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full py-3 bg-brand-purple text-white font-bold rounded-xl text-sm disabled:opacity-50">
                    {isUploading ? 'Yükleniyor...' : 'Form Gönder'}
                  </button>
               </form>
            )}
            <h4 className="font-bold text-gray-800 dark:text-zinc-200">Form Geçmişi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fetchedFormChecks.length === 0 && <p className="text-sm text-gray-400">Kayıt bulunamadı.</p>}
              {fetchedFormChecks.map(check => (
                <div key={check.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl items-center border border-gray-100 dark:border-zinc-800">
                  <img src={check.front_pose_url} alt="Form" className="w-20 h-20 object-cover rounded-xl" />
                  <div className="text-sm">
                    <p className="font-black text-brand-purple text-lg">{check.current_weight} kg</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">{new Date(check.created_at).toLocaleDateString('tr-TR')} - {new Date(check.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === GÜNLÜK VERİLER SEKMESİ === */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {userRole === 'student' && (
              <form onSubmit={handleDailySubmit} className="space-y-4 border-b dark:border-zinc-800 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">SU (Litre)</label>
                    <input type="number" step="0.1" value={water} onChange={e => setWater(e.target.value)} required className="w-full p-3 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">SODYUM (mg)</label>
                    <input type="number" value={sodium} onChange={e => setSodium(e.target.value)} required className="w-full p-3 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Protein (g)" value={protein} onChange={e => setProtein(e.target.value)} required className="p-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm font-medium" />
                  <input type="number" placeholder="Karb (g)" value={carb} onChange={e => setCarb(e.target.value)} required className="p-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm font-medium" />
                  <input type="number" placeholder="Yağ (g)" value={fat} onChange={e => setFat(e.target.value)} required className="p-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm font-medium" />
                </div>
                <button type="submit" className="w-full py-3 bg-brand-purple text-white font-bold rounded-xl text-sm">Raporu Gönder</button>
              </form>
            )}
            <h4 className="font-bold text-gray-800 dark:text-zinc-200">Rapor Geçmişi</h4>
            <div className="space-y-3">
              {fetchedDailyLogs.length === 0 && <p className="text-sm text-gray-400">Kayıt bulunamadı.</p>}
              {fetchedDailyLogs.map(log => (
                <div key={log.id} className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl text-sm grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-100 dark:border-zinc-800">
                  <div className="flex justify-between md:block">
                    <span className="text-gray-500 text-xs font-bold uppercase">Tarih</span> 
                    <p className="font-bold text-gray-800 dark:text-zinc-200 mt-1">{new Date(log.log_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex justify-between md:block">
                    <span className="text-gray-500 text-xs font-bold uppercase">Su / Sodyum</span> 
                    <p className="font-bold text-emerald-500 mt-1">{log.water_lt}L / {log.sodium_mg}mg</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 pt-2 border-t dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-bold uppercase">Makrolar (P/C/Y)</span> 
                    <p className="font-mono bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded-lg font-bold text-brand-purple text-xs">
                      {log.macros?.protein}g / {log.macros?.carb}g / {log.macros?.fat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}