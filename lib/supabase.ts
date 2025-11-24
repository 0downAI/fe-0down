import { createClient } from "@supabase/supabase-js";

// Pakai NEXT_PUBLIC_ agar bisa dibaca browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
