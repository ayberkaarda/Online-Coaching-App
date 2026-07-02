'use client'

import { createStudentAction, deleteStudentAction } from "@/app/actions";

export function AdminUserManagement({ students }) {
  async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createStudentAction(formData);
    if (res.success) {
      alert("Öğrenci başarıyla eklendi.");
      e.target.reset();
    } else {
      alert("Hata: " + res.error);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-gray-100 dark:border-zinc-800 mt-8">
      <h3 className="text-lg font-bold mb-4 text-brand-purple">Sistem Kullanıcı Yönetimi (Admin)</h3>
      
      {/* Öğrenci Ekleme Formu */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input name="fullName" placeholder="Ad Soyad" required className="p-2.5 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm" />
        <input name="email" type="email" placeholder="E-posta" required className="p-2.5 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm" />
        <input name="password" type="password" placeholder="Şifre" required className="p-2.5 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 text-sm" />
        <button type="submit" className="md:col-span-3 py-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white rounded-xl text-sm font-semibold hover:opacity-90">
          Yeni Öğrenci Ekle
        </button>
      </form>

      {/* Öğrenci Listesi */}
      <div className="border-t dark:border-zinc-800 pt-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Kayıtlı Öğrenciler</h4>
        <ul className="space-y-2">
          {students?.filter(s => s.role !== 'admin').map(s => (
            <li key={s.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl text-sm">
              <span>{s.full_name} ({s.email || 'Kayıtlı'})</span>
              <button 
                onClick={async () => {
                  if(confirm("Silmek istediğinize emin misiniz?")) await deleteStudentAction(s.id);
                }}
                className="text-red-500 hover:underline font-medium text-xs"
              >
                Kullanıcıyı Sil
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}