'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    // Supabase ile giriş yap
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError('Giriş başarısız. Bilgilerinizi kontrol edin.');
    } else {
      router.push('/'); // Başarılıysa ana sayfaya yolla
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f12]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#16161d] rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-center text-brand-purple mb-6">Sisteme Giriş</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">E-POSTA</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:border-brand-purple"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">ŞİFRE</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:border-brand-purple"
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 mt-2 bg-brand-purple hover:bg-brand-purpleHover text-white font-semibold rounded-xl transition-all">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}