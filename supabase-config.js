// ============================================================
// Configuration Supabase — Coalla
// ============================================================
// REMPLACE les valeurs ci-dessous par celles de TON projet Supabase.
// Tu les trouves dans : Supabase Dashboard > Project Settings > API
//
// SUPABASE_URL  = "Project URL"     (ex: https://abcdefgh.supabase.co)
// SUPABASE_KEY  = "anon public key" (la longue chaine qui commence par "eyJ...")
//
// ⚠️ IMPORTANT : n'utilise JAMAIS la clé "service_role" ici, uniquement "anon public".
// ============================================================

var SUPABASE_URL = "https://sbztdvcvfghxvmkrzach.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNienRkdmN2ZmdoeHZta3J6YWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMzgzODAsImV4cCI6MjA5OTkxNDM4MH0.ALcwbGNZziOWn834jz9MMCNCBfXHNCcM0PgC7_zgGEc";

// Initialisation du client Supabase (global, accessible partout dans app.js)
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
