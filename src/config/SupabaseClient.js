import { createClient } from '@supabase/supabase-js'

// Vite only exposes env vars prefixed with VITE_ to the client bundle.
// Keys without the prefix are always undefined at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
