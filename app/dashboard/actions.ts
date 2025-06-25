"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { put } from "@vercel/blob"

const LogMealSchema = z.object({
  dish_name: z.string().min(1, "Названи�� блюда обязательно"),
  grams: z.coerce.number().positive("Вес должен быть положительным числом"),
  calories: z.coerce.number().min(0, "Калории не могут быть отрицательными"),
  protein: z.coerce.number().min(0, "Белки не могут быть отрицательными"),
  carbs: z.coerce.number().min(0, "Углеводы не могут быть отрицательными"),
  fat: z.coerce.number().min(0, "Жиры не могут быть отрицательными"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  eaten_on_date: z.string().min(1, "Дата обязательна"),
})

export type FormState = {
  message: string
  errors?: {
    dish_name?: string[]
    grams?: string[]
    calories?: string[]
    protein?: string[]
    carbs?: string[]
    fat?: string[]
    meal_type?: string[]
    eaten_on_date?: string[]
    _form?: string[]
  }
  success: boolean
  photoReceived?: boolean // <-- Новое поле
}

export async function addLoggedMeal(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      message: "Ошибка: Пользователь не аутентифицирован.",
      success: false,
    }
  }

  const photoFile = formData.get("meal_photo") as File | null

  if (photoFile && photoFile.size > 0) {
    try {
      // Загружаем фото в Vercel Blob
      const blob = await put(`meals/${user.id}/${Date.now()}-${photoFile.name}`, photoFile, {
        access: "public",
      })

      // Сохраняем запись с URL фото в базу данных
      const { error } = await supabase.from("logged_meals").insert([
        {
          user_id: user.id,
          dish_name: `Фото: ${photoFile.name}`,
          photo_url: blob.url,
          grams: 0, // Пока 0, будет обновлено после AI анализа
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meal_type: formData.get("meal_type") || "lunch",
          eaten_on_date: new Date((formData.get("eaten_on_date") as string) || new Date().toISOString())
            .toISOString()
            .split("T")[0],
          source: "photo",
        },
      ])

      if (error) {
        console.error("Supabase error:", error)
        return {
          message: `Ошибка сохранения в базу данных: ${error.message}`,
          success: false,
        }
      }

      revalidatePath("/dashboard")
      return {
        message: `Фото "${photoFile.name}" успешно загружено и сохранено! AI анализ будет добавлен позже.`,
        success: true,
        photoReceived: true,
      }
    } catch (error) {
      console.error("Blob upload error:", error)
      return {
        message: "Ошибка при загрузке фото. Попробуйте снова.",
        success: false,
      }
    }
  }

  // Если фото нет, продолжаем с ручным вводом
  const validatedFields = LogMealSchema.safeParse({
    dish_name: formData.get("dish_name"),
    grams: formData.get("grams"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    carbs: formData.get("carbs"),
    fat: formData.get("fat"),
    meal_type: formData.get("meal_type"),
    eaten_on_date: formData.get("eaten_on_date"),
  })

  if (!validatedFields.success) {
    // Убедимся, что все поля, кроме dish_name, не являются обязательными, если dish_name пустое
    // Это предотвратит ошибку валидации, если пользователь просто загрузил фото и не заполнял другие поля
    const dishName = formData.get("dish_name")
    if (!dishName && validatedFields.error.flatten().fieldErrors.dish_name) {
      // Если ошибка только в dish_name и оно пустое, а другие поля могут быть не заполнены,
      // это нормально, если пользователь хотел только загрузить фото.
      // Но т.к. мы выше уже обработали фото, сюда мы не должны попасть, если фото было.
      // Эта логика больше для случая, если бы мы хотели разрешить пустую форму без фото.
    }

    return {
      message: "Ошибка валидации. Проверьте введенные данные.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    }
  }

  // Проверка, что если dish_name пустое, то и остальные поля должны быть пустыми или невалидными
  // чтобы не пытаться сохранить "пустую" запись, если пользователь просто нажал submit без данных
  if (
    !validatedFields.data.dish_name &&
    !validatedFields.data.grams &&
    !validatedFields.data.calories &&
    !validatedFields.data.protein &&
    !validatedFields.data.carbs &&
    !validatedFields.data.fat
  ) {
    return {
      message: "Пожалуйста, заполните данные о приеме пищи или загрузите фото.",
      success: false,
    }
  }

  const { dish_name, grams, calories, protein, carbs, fat, meal_type, eaten_on_date } = validatedFields.data

  try {
    const { error } = await supabase.from("logged_meals").insert([
      {
        user_id: user.id,
        dish_name,
        grams,
        calories,
        protein,
        carbs,
        fat,
        meal_type, // <-- Исправлено: теперь правильно используем meal_type
        eaten_on_date: new Date(eaten_on_date).toISOString().split("T")[0], // <-- Исправлено: теперь правильно используем eaten_on_date
        source: "webapp",
      },
    ])

    if (error) {
      console.error("Supabase error:", error)
      return {
        message: `Ошибка базы данных: ${error.message}`,
        success: false,
      }
    }

    revalidatePath("/dashboard")
    return { message: "Прием пищи успешно добавлен!", success: true }
  } catch (e) {
    console.error("Unexpected error:", e)
    return {
      message: "Произошла непредвиденная ошибка. Попробуйте снова.",
      success: false,
    }
  }
}

export async function deleteLoggedMeal(mealId: string): Promise<{ success: boolean; message: string }> {
  if (!mealId) {
    return { success: false, message: "Ошибка: ID приема пищи не предоставлен." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Ошибка: Пользователь не аутентифицирован." }
  }

  try {
    const { error } = await supabase.from("logged_meals").delete().match({ id: mealId, user_id: user.id })

    if (error) {
      console.error("Supabase delete error:", error)
      return { success: false, message: `Ошибка базы данных при удалении: ${error.message}` }
    }

    revalidatePath("/dashboard")
    return { success: true, message: "Прием пищи успешно удален!" }
  } catch (e) {
    console.error("Unexpected delete error:", e)
    return { success: false, message: "Произошла непредвиденная ошибка при удалении. Попробуйте снова." }
  }
}
