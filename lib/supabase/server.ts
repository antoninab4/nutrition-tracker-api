import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createSupabaseServerClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: async (name: string) => {
        return (await cookies()).get(name)?.value
      },
      set: async (name: string, value: string, options: CookieOptions) => {
        try {
          ;(await cookies()).set({ name, value, ...options })
        } catch (error) {
          // Игнорируем ошибки установки cookie в Server Components
        }
      },
      remove: async (name: string, options: CookieOptions) => {
        try {
          ;(await cookies()).set({ name, value: "", ...options })
        } catch (error) {
          // Игнорируем ошибки удаления cookie в Server Components
        }
      },
    },
  })
}
