import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yrbemlwmmyeqfwzjaksr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_oJBh5fZLRTeGQzVLZRDJ7g_XEDvAK4G'

export const DB_HOST = 'yrbemlwmmyeqfwzjaksr.supabase.co'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})
