'use client'

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

export function DashboardTabs({ currentUserId, userRole, students }) {
  const [activeTab, setActiveTab] = useState('formCheck');
  const exportRef = useRef(null);

  // Admin Kontrolü İçin Seçilen Öğrenci
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  // Çekilen Veriler (Fetch States)
  const [fetchedFormChecks, setFetchedFormChecks] = useState([]);
  const [fetchedDailyLogs, setFetchedDailyLogs] = useState([]);

  // Form Check State'leri
  const [isUploading, setIsUploading] = useState(false);
  const [weight, setWeight] = useState('');

  // Günlük Rapor State'leri
  const [water, setWater] = useState('');
  const [sodium, setSodium] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  // 1. VERİ ÇEKME İŞLEMİ (Tab değiştiğinde veya admin öğrenci seçtiğinde tetiklenir)
  useEffect(() => {
    // Adminse seçtiği öğrencinin, öğrenciyse kendi ID'sinin verisini çeker
    const targetId = userRole === 'admin' ? selectedStudentId : currentUserId;
    if (!targetId) return;

    const fetchData = async () => {
      if (activeTab === 'formCheck') {
        const { data } = await supabase.from('form_checks').select('*').eq('student_id', targetId).order('created_at', { ascending: false });
        setFetchedFormChecks(data || []);
      } else if (activeTab === 'daily') {
        const { data } = await supabase.from('daily_logs').select('*').eq('student_id', targetId).order('log_date', { ascending: false });
        setFetchedDailyLogs(data || []);
      }
    };
    fetchData();
  }, [activeTab, selectedStudentId, currentUserId, userRole]);

  // 2. FOTOĞRAF YÜKLEME (Öğrenci)
  const handleFileUpload = async (e) => {
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

      const { error: dbError } = await supabase.from('form_checks').insert([{
        student_id: currentUserId, current_weight: parseFloat(weight), front_pose_url: publicUrl, notes: "Yeni form"
      }]);
      if (dbError) throw dbError;

      alert("Form başarıyla iletildi!");
      e.target.reset(); setWeight('');
      
      // Listeyi güncelle
      const { data } = await supabase.from('form_checks').select('*').eq('student_id', currentUserId).order('created_at', { ascending: false });
      setFetchedFormChecks(data || []);
    } catch (error) {
      alert("Hata: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. GÜNLÜK RAPOR GÖNDERME (Öğrenci)
  const handleDailySubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('daily_logs').insert([{
      student_id: currentUserId, water_lt: parseFloat(water), sodium_mg: parseInt(sodium), macros: { protein, carb, fat }
    }]);

    if (error) alert("Hata: " + error.message);
    else {
      alert("Günlük veriler kaydedildi!");
      setWater(''); setSodium(''); setProtein(''); setCarb(''); setFat('');
      
      // Listeyi güncelle
      const { data } = await supabase.from('daily_logs').select('*').eq('student_id', currentUserId).order('log_date', { ascending: false });
      setFetchedDailyLogs(data || []);
    }
  };

  // Dışa Aktarma Araçları
  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `kocluk_${activeTab}.png`; link.click();
  };

  return (
    <div className="w-full mt-8">
      
      {/* ADMİN ÖĞRENCİ SEÇİM PANELİ */}
      {userRole === 'admin' && (
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-brand-purple/30 shadow-sm">
          <label className="block text-xs font-bold text-brand-purple mb-2">İNCELEMEK İÇİN ÖĞRENCİ SEÇ</label>
          <select 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full p-2.5 rounded-lg border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none focus:border-brand-purple"
          >
            <option value="">-- Öğrenci Seçiniz --</option>
            {students?.filter(s => s.role !== 'admin').map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* SEKMELER */}
      <div className="flex justify-between border-b border-gray-200 dark:border-zinc-800 text-sm font-medium">
        <button onClick={() => setActiveTab('formCheck')} className={`pb-3 flex items-center transition-all relative ${activeTab === 'formCheck' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}>
          Form Check {activeTab === 'formCheck' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
        <button onClick={() => setActiveTab('daily')} className={`pb-3 flex items-center transition-all relative ${activeTab === 'daily' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}>
          Günlük Veriler {activeTab === 'daily' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={handleDownloadImage} className="text-xs bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 px-3 py-1.5 rounded-lg font-semibold">
          📸 Görsel İndir
        </button>
      </div>

      {/* İÇERİK ALANI */}
      <div ref={exportRef} className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
        
        {/* === FORM CHECK SEKMESİ === */}
        {activeTab === 'formCheck' && (
          <div className="space-y-6">
            {userRole === 'student' && (
               <form onSubmit={handleFileUpload} className="space-y-4 border-b dark:border-zinc-800 pb-6">
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">GÜNCEL KİLO</label>
                      <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required className="w-full p-2.5 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">PODYUM / FORM</label>
                      <input type="file" name="poseImage" accept="image/*" required className="w-full text-xs text-gray-500 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-purple/10 file:text-brand-purple cursor-pointer" />
                    </div>
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full py-2.5 bg-brand-purple text-white font-bold rounded-xl text-sm disabled:opacity-50">
                    {isUploading ? 'Yükleniyor...' : 'Form Gönder'}
                  </button>
               </form>
            )}

            {/* Form Geçmişi Listeleme */}
            <h4 className="font-bold text-gray-800 dark:text-zinc-200">Form Geçmişi</h4>
            <div className="space-y-4">
              {fetchedFormChecks.length === 0 ? <p className="text-sm text-gray-400">Kayıt bulunamadı.</p> : null}
              {fetchedFormChecks.map(check => (
                <div key={check.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-zinc-950 rounded-xl items-center">
                  <img src={check.front_pose_url} alt="Form" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-zinc-800" />
                  <div className="text-sm">
                    <p className="font-bold text-brand-purple">{check.current_weight} kg</p>
                    <p className="text-xs text-gray-500">{new Date(check.created_at).toLocaleDateString('tr-TR')}</p>
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
                    <input type="number" step="0.1" value={water} onChange={e => setWater(e.target.value)} required className="w-full p-2.5 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">SODYUM (mg)</label>
                    <input type="number" value={sodium} onChange={e => setSodium(e.target.value)} required className="w-full p-2.5 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Protein (g)" value={protein} onChange={e => setProtein(e.target.value)} required className="p-2 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 text-xs" />
                  <input type="number" placeholder="Karb (g)" value={carb} onChange={e => setCarb(e.target.value)} required className="p-2 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 text-xs" />
                  <input type="number" placeholder="Yağ (g)" value={fat} onChange={e => setFat(e.target.value)} required className="p-2 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 text-xs" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-brand-purple text-white font-bold rounded-xl text-sm hover:opacity-90">Raporu Gönder</button>
              </form>
            )}

            {/* Günlük Veri Listeleme */}
            <h4 className="font-bold text-gray-800 dark:text-zinc-200">Rapor Geçmişi</h4>
            <div className="space-y-3">
              {fetchedDailyLogs.length === 0 ? <p className="text-sm text-gray-400">Henüz rapor girilmedi.</p> : null}
              {fetchedDailyLogs.map(log => (
                <div key={log.id} className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-xl text-sm grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 text-xs">Tarih:</span> 
                    <p className="font-bold">{new Date(log.log_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Su / Sodyum:</span> 
                    <p className="font-semibold text-brand-purple">{log.water_lt}L / {log.sodium_mg}mg</p>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-gray-500 text-xs">Makrolar (P / C / Y):</span> 
                    <p className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded inline-block ml-2 text-xs">
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