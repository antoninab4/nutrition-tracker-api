import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Если middleware вызывается для API route, request.cookies.set может быть недоступен
          // В этом случае мы просто обновляем response.cookies
          try {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            // Игнорируем ошибку, если request.cookies.set не сработал (например, в API route)
            // response.cookies.set все равно должен сработать
            response.cookies.set({
              name,
              value,
              ...options,
            })
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({
              name,
              value: "",
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: "",
              ...options,
            })
          } catch (error) {
            response.cookies.set({
              name,
              value: "",
              ...options,
            })
          }
        },
      },
    },
  )

  // Важно: обновить сессию пользователя, чтобы куки были свежими
  // Это особенно важно для Server Components
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Сопоставлять все пути запросов, кроме тех, которые начинаются с:
     * - _next/static (статические файлы)
     * - _next/image (файлы оптимизации изображений)
     * - favicon.ico (файл favicon)
     * - любые файлы с расширениями изображений (svg, png, jpg, jpeg, gif, webp)
     * Не стесняйтесь изменять этот шаблон для включения большего количества путей.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
