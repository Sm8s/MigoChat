import { createClient } from '@supabase/supabase-js';

// Diese Variablen werden von Vercel (oder deiner .env Datei lokal) automatisch erkannt
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Hier wird der Supabase-Client erstellt, den wir in der ganzen App nutzen
export const supabase = createClient(supabaseUrl, supabaseAnonKey);