"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server" // <--- ИЗМЕНЕНО ЗДЕСЬ
import { redirect } from "next/navigation"

export async function logout() {
  const supabase = createSupabaseServerClient() // <--- ИЗМЕНЕНО ЗДЕСЬ
  await supabase.auth.signOut()
  return redirect("/")
}
