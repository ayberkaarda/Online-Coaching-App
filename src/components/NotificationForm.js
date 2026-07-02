'use client'

import { sendNotificationAction } from "@/app/actions";
import { useState } from "react";

export function NotificationForm({ students }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await sendNotificationAction(formData);
    setLoading(false);
    if (res.success) {
      alert("Bildirim başarıyla gönderildi!");
      e.target.reset();
    } else {
      alert("Hata: " + res.error);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-800 transition-all">
      {/* Kart Başlığı */}
      <div className="bg-brand-purple p-4 text-white flex items-center gap-2 font-semibold text-lg">
        <span>📢</span>
        <h2>Bildirim Gönder</h2>
      </div>

      {/* Form Alanı */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">KİME</label>
          <select 
            name="target" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:border-brand-purple transition-all"
          >
            <option value="all">🌐 Tüm öğrenciler</option>
            {students?.map(s => (
              <option key={s.id} value={s.id}>👤 {s.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">BAŞLIK</label>
          <input 
            type="text" 
            name="title" 
            required
            placeholder="Ör: Bu hafta tatil programı" 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm placeholder-gray-400 focus:outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">MESAJ (OPSİYONEL)</label>
          <textarea 
            name="message" 
            rows={3}
            placeholder="Detaylı mesajını buraya yazabilirsin..." 
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm placeholder-gray-400 focus:outline-none focus:border-brand-purple transition-all resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-brand-purple hover:bg-brand-purpleHover text-white font-semibold rounded-xl transition-all disabled:opacity-50 text-sm shadow-md"
        >
          {loading ? "Gönderiliyor..." : "Herkese Gönder"}
        </button>
      </form>
    </div>
  );
}