'use client'

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

export function DashboardTabs({ currentUserId, userRole, formChecksCount = 0, dailyCount = 3, workoutCount = 4 }) {
  const [activeTab, setActiveTab] = useState('formCheck');
  const [isUploading, setIsUploading] = useState(false);
  const [weight, setWeight] = useState('');
  const exportRef = useRef(null);

  // SUPABASE STORAGE FOTOĞRAF YÜKLEME
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!currentUserId || !weight) return alert("Lütfen güncel tartı kilonuzu girin.");
    
    const file = e.target.poseImage.files[0];
    if (!file) return alert("Lütfen bir form fotoğrafı seçin.");

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
      const filePath = `poses/${fileName}`;

      // 1. Storage'a Yükle
      const { error: uploadError } = await supabase.storage
        .from('form-checks-media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      // Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from('form-checks-media')
        .getPublicUrl(filePath);

      // 2. Veritabanına Kaydet
      const { error: dbError } = await supabase.from('form_checks').insert([
        {
          student_id: currentUserId,
          current_weight: parseFloat(weight),
          front_pose_url: publicUrl,
          notes: "Yeni form güncellendi."
        }
      ]);

      if (dbError) throw dbError;
      
      alert("Form başarıyla koça iletildi!");
      e.target.reset();
      setWeight('');
    } catch (error) {
      alert("Yükleme hatası: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `kocluk_programi_${activeTab}.png`;
    link.click();
  };

  const handleDownloadCSV = () => {
    const headers = "Kategori,Baslik,Detay,Tarih\n";
    let csvData = "";
    if (activeTab === 'daily') {
      csvData += "Gunluk,Su Tuketimi,4 Litre,Bugun\n";
      csvData += "Gunluk,Sodyum,3000mg,Bugun\n";
      csvData += "Gunluk,Makro,200p 400c 60f,Bugun\n";
    } else {
      csvData += "Antrenman,Classic Physique Hazirlik,Aktif,Bugun\n";
    }
    const blob = new Blob(["\uFEFF" + headers + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kocluk_programi_${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between border-b border-gray-200 dark:border-zinc-800 text-sm font-medium">
        <button onClick={() => setActiveTab('formCheck')} className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'formCheck' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}>
          Form Check {activeTab === 'formCheck' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
        <button onClick={() => setActiveTab('daily')} className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'daily' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}>
          Günlük {activeTab === 'daily' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
        <button onClick={() => setActiveTab('workout')} className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'workout' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}>
          Antrenman {activeTab === 'workout' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={handleDownloadCSV} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors font-semibold">
          📊 CSV İndir
        </button>
        <button onClick={handleDownloadImage} className="text-xs bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 px-3 py-1.5 rounded-lg transition-colors font-semibold">
          📸 Fotoğraf İndir
        </button>
      </div>

      <div ref={exportRef} className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
        
        {activeTab === 'formCheck' && (
          <div className="space-y-4">
             <h4 className="font-bold text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-2">Form & Tartı Güncellemesi</h4>
             {userRole === 'student' ? (
               <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">GÜNCEL KİLO (Örn: 85.5)</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required className="w-full p-2.5 rounded-xl border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm focus:border-brand-purple focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">PODYUM / FORM FOTOĞRAFI</label>
                    <input type="file" name="poseImage" accept="image/*" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20 transition-all cursor-pointer" />
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full py-2.5 bg-brand-purple text-white font-bold rounded-xl text-sm disabled:opacity-50">
                    {isUploading ? 'Yükleniyor...' : 'Koça Gönder'}
                  </button>
               </form>
             ) : (
               <p className="text-sm text-gray-400">Yönetici panelindesiniz. Gelen form check'ler burada listelenecektir.</p>
             )}
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="text-sm space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-2">Günlük Rapor</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex justify-between"><span>Su Tüketimi:</span> <span className="font-semibold text-brand-purple">4.0 Litre</span></li>
              <li className="flex justify-between"><span>Sodyum:</span> <span className="font-semibold text-brand-purple">3000 mg</span></li>
            </ul>
          </div>
        )}

        {activeTab === 'workout' && (
          <div className="text-sm space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-2">Aktif Antrenman Programı</h4>
            <p className="text-gray-500">Antrenman verileri veritabanından çekilecektir.</p>
          </div>
        )}
      </div>
    </div>
  );
}