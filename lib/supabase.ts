import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://qbcnmrnpaiydmkqtktxf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY25tcm5wYWl5ZG1rcXRrdHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTE0NjMsImV4cCI6MjA4OTM4NzQ2M30.DHf6-sbllTzilBPEflXa72wM_BkhnXfvhxLydLwz0zY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});