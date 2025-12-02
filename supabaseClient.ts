import { createClient } from '@supabase/supabase-js';

// --- INSTRUÇÕES ---
// Cole suas credenciais do Supabase que você copiou do seu projeto.
// 1. Substitua "SUA_URL_AQUI" pela sua Project URL.
// 2. Substitua "SUA_CHAVE_AQUI" pela sua chave 'anon' 'public'.

// FIX: Add explicit string types to prevent TypeScript from inferring literal types, which was causing a comparison error on line 18.
const supabaseUrl: string = "https://qwzupedxbddznnxtmjwd.supabase.co";
const supabaseKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3enVwZWR4YmRkem5ueHRtandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTUzNzMsImV4cCI6MjA3ODY3MTM3M30.Rieci4XAEj5qmi8df4O-fYypeTB6rnJv5edE6-O3uWc";

// Exemplo de como deve ficar:
// const supabaseUrl = "https://ytrewq.supabase.co";
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...";


// O código abaixo verificará se você inseriu as credenciais.
// Se não, ele retornará null para habilitar o 'modo de demonstração'.
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== "SUA_URL_AQUI" && supabaseKey !== "SUA_CHAVE_AQUI")
  ? createClient(supabaseUrl, supabaseKey)
  : null;