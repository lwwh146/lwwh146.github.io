import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yordcfhrlrvcvlkvmvft.supabase.co'
// 这里填入你截图里那个以 sb_publishable_ 开头的 API Key
const supabaseKey = 'sb_publishable_fD1YyPMV4ZMpTCv5l2iNyw_7E_3kQr9' 

export const supabase = createClient(supabaseUrl, supabaseKey)