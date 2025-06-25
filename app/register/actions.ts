"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server" // <--- ИЗМЕНЕНО ЗДЕСЬ
import { revalidatePath } from "next/cache"

export async function signup(formData: FormData) {
  const email = String(formData.get("email"))
  const password = String(formData.get("password"))

  if (!email || !password) {
    return { message: "Пожалуйста, заполните все поля.", error: true }
  }

  if (password.length < 6) {
    return { message: "Пароль должен содержать не менее 6 символов.", error: true }
  }

  const supabase = createSupabaseServerClient() // <--- ИЗМЕНЕНО ЗДЕСЬ

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    console.error("Ошибка при регистрации:", error)
    return { message: error.message, error: true }
  }

  revalidatePath("/")
  return { message: "Регистрация прошла успешно! Пожалуйста, подтвердите свой email.", error: false }
}
