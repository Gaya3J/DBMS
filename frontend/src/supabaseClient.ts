import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vupafdebdodndrclxjhb.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_RekbjwNkjt2Q8_PIw9FSUw_bQ-z0y-v"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
