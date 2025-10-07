import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xbouqnlgzfjmbellztpw.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced configuration for production environment
const supabaseOptions = {
  auth: {
    // Persist session in localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Handle auth errors more gracefully
    flowType: 'pkce'
  },
  // Add timeout for better error handling
  global: {
    headers: { 'x-application-name': 'notes-app' }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)