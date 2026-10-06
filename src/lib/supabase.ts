import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dyhphvibuczflpkbtxxb.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_ztHjNcfWb4PYhSO4rReuuQ_dR5CU_Cp";

if (typeof window === "undefined" && typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class {};
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});

