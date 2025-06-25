export const dynamic = "force-dynamic"

import { createSupabaseServerClient } from "@/lib/supabase/server" // <--- ИЗМЕНЕНО ЗДЕСЬ
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function LandingPage() {
  const supabase = createSupabaseServerClient() // <--- ИЗМЕНЕНО ЗДЕСЬ
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl">
          Питание-Трекер
        </Link>
        <nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline">Дашборд</Button>
                </Link>
                <form action={logout}>
                  <Button>Выйти</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Войти</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-green-600 hover:bg-green-700">Регистрация</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Добро пожаловать в Питание-Трекер!</h1>
          <p className="text-gray-600">Отслеживайте свое питание легко и эффективно.</p>
        </div>
      </main>

      <footer className="h-16 flex items-center justify-center border-t">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} Питание-Трекер. Все права защищены.</p>
      </footer>
    </div>
  )
}
