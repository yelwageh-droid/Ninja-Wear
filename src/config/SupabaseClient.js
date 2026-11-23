import { createClient } from '@supabase/supabase-js'

// Vite only exposes env vars prefixed with VITE_ to the client bundle.
// Keys without the prefix are always undefined at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Resolve the shared client for data services, surfacing a clear error when unconfigured / إرجاع عميل Supabase مع خطأ واضح عند عدم التهيئة
export function getSupabase() {
  if (!supabase) return Promise.reject(new Error('Supabase client not initialized'))
  return Promise.resolve(supabase)
}

export default supabase
