import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createSupabaseServerClient() {
  // Сама функция-обертка остается синхронной. Она просто создает и возвращает клиент.
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      // Все методы для работы с cookie теперь асинхронные,
      // чтобы мы могли использовать `await` для вызова `cookies()`.
      get: async (name: string) => {
        // Мы дожидаемся (await) получения объекта cookie, и только потом вызываем .get()
        return (await cookies()).get(name)?.value
      },
      set: async (name: string, value: string, options: CookieOptions) => {
        try {
          // То же самое для .set()
          ;(await cookies()).set({ name, value, ...options })
        } catch (error) {
          // Ошибки при установке cookie из Server Component можно игнорировать,
          // если у вас есть middleware, обновляющее сессии.
        }
      },
      remove: async (name: string, options: CookieOptions) => {
        try {
          // И для .remove() (который под капотом тоже использует .set())
          ;(await cookies()).set({ name, value: "", ...options })
        } catch (error) {
          // Ошибки при удалении cookie из Server Component можно игнорировать.
        }
      },
    },
  })
}
