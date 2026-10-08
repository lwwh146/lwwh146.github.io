import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uyvfzxzdpaqconchair.supabase.co'
const supabaseKey = 'sb_publishable_bo0b4SwnbwEpk5gzk6-tcw_6WMR96S4' 

export const supabase = createClient(supabaseUrl, supabaseKey)