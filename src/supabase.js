import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yordcfhrlrvcvlvkmvft.supabase.co'
const supabaseKey = 'sb_publishable_fD1YyPMV4ZMpTCv5l2iNyw_7E_3kQr9' 

export const supabase = createClient(supabaseUrl, supabaseKey)