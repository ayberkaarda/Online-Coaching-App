'use client'

import { useState, useRef } from "react";
import html2canvas from "html2canvas";

export function DashboardTabs({ formChecksCount = 0, dailyCount = 3, workoutCount = 4 }) {
  const [activeTab, setActiveTab] = useState('daily');
  const exportRef = useRef(null); // Fotoğrafı çekilecek alanı referans alır

  // 1. FOTOĞRAF OLARAK İNDİRME FONKSİYONU
  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    
    // html2canvas ile belirtilen DOM elemanının ekran görüntüsünü al
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: null, // Arka planı şeffaf/temaya uygun alır
      scale: 2 // Çözünürlüğü artırmak için
    });
    
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `kocluk_programi_${activeTab}.png`;
    link.click();
  };

  // 2. CSV (EXCEL) OLARAK İNDİRME FONKSİYONU
  const handleDownloadCSV = () => {
    // Örnek veriler (Gerçekte Supabase'den gelen datayı buraya map'leyeceksin)
    const headers = "Kategori,Baslik,Detay,Tarih\n";
    let csvData = "";

    if (activeTab === 'daily') {
      csvData += "Gunluk,Su Tuketimi,3.5 Litre,Bugun\n";
      csvData += "Gunluk,Sodyum,2000mg,Bugun\n";
      csvData += "Gunluk,Makro,250p 300c 50f,Bugun\n";
    } else if (activeTab === 'workout') {
      csvData += "Antrenman,Gogus - Incline Press,4 Set 12 Tekrar,Bugun\n";
      csvData += "Antrenman,Gogus - Cable Crossover,3 Set 15 Tekrar,Bugun\n";
    } else {
      csvData += "Form,Guncel Kilo,85.00 kg,Bugun\n";
    }

    // Türkçe karakter (UTF-8) sorununu çözmek için BOM ekliyoruz (\uFEFF)
    const blob = new Blob(["\uFEFF" + headers + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kocluk_programi_${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {/* Sekme Butonları */}
      <div className="flex justify-between border-b border-gray-200 dark:border-zinc-800 text-sm font-medium">
        <button 
          onClick={() => setActiveTab('formCheck')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'formCheck' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}
        >
          Form Check
          {activeTab === 'formCheck' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>

        <button 
          onClick={() => setActiveTab('daily')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'daily' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}
        >
          Günlük 
          <span className="bg-orange-500 text-white text-[11px] px-1.5 py-0.5 rounded-full font-bold">{dailyCount}</span>
          {activeTab === 'daily' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>

        <button 
          onClick={() => setActiveTab('workout')}
          className={`pb-3 flex items-center gap-1.5 transition-all relative ${activeTab === 'workout' ? 'text-brand-purple font-bold' : 'text-gray-400'}`}
        >
          Antrenman 
          <span className="bg-orange-500 text-white text-[11px] px-1.5 py-0.5 rounded-full font-bold">{workoutCount}</span>
          {activeTab === 'workout' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-purple" />}
        </button>
      </div>

      {/* Dışa Aktarma (Export) Butonları */}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={handleDownloadCSV} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1">
          📊 CSV İndir
        </button>
        <button onClick={handleDownloadImage} className="text-xs bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1">
          📸 Fotoğraf İndir
        </button>
      </div>

      {/* İÇERİK ALANI (Fotoğrafı çekilecek olan div) */}
      <div ref={exportRef} className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
        
        {/* Sistem Supabase ile bağlandığında bu alanlar dinamik dolacak */}
        {activeTab === 'formCheck' && (
          <div className="text-center text-sm text-gray-400 dark:text-zinc-500">
            Bu hafta henüz form check gönderilmedi.
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="text-sm space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-2">Günlük Makro ve Rapor</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex justify-between"><span>Su Tüketimi:</span> <span className="font-semibold text-brand-purple">3.5 Litre</span></li>
              <li className="flex justify-between"><span>Sodyum:</span> <span className="font-semibold text-brand-purple">2000 mg</span></li>
              <li className="flex justify-between"><span>Makrolar (P/C/Y):</span> <span className="font-semibold text-brand-purple">250g / 300g / 50g</span></li>
            </ul>
          </div>
        )}

        {activeTab === 'workout' && (
          <div className="text-sm space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 border-b dark:border-zinc-800 pb-2">Bugünkü Antrenman: Göğüs</h4>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex justify-between items-center border-b border-dashed dark:border-zinc-800 pb-2">
                <span>Incline Dumbbell Press</span> 
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">4 x 12</span>
              </li>
              <li className="flex justify-between items-center border-b border-dashed dark:border-zinc-800 pb-2">
                <span>Cable Crossover</span> 
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">3 x 15</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Pec Deck Fly</span> 
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">3 x 12</span>
              </li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}