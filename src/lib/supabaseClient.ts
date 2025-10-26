import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghyarngeapkeqnlegkei.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWFybmdlYXBrZXFubGVna2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjQ0NDQsImV4cCI6MjA3NzA0MDQ0NH0.UbAqQQGMMZ5LP-CoVWEB-HdsJdJ-BExWlN2rQ5Olsx0'

export const supabase = createClient(supabaseUrl, supabaseKey)
