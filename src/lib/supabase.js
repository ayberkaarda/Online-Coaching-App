import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Genel veri çekme/gönderme işlemleri için standart istemci
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sadece Server Actions içinde çalıştırılacak Admin İstemcisi (Kullanıcı Silme/Ekleme için)
export const getSupabaseAdmin = () => {
  if (!supabaseServiceKey) {
    throw new Error("Kritik Hata: Service Role Key eksik!");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};