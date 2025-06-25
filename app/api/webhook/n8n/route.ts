import { createSupabaseServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Схема для получения новых фотографий (адаптирована под вашу схему)
const GetPhotosSchema = z.object({
  action: z.literal("get_photos"),
  limit: z.number().optional().default(10),
})

// Схема для обновления записи после AI анализа (адаптирована под вашу схему)
const UpdateMealSchema = z.object({
  action: z.literal("update_meal"),
  meal_id: z.string(),
  dish: z.string(), // dish вместо dish_name
  grams: z.number(),
  kcal: z.number(), // kcal вместо calories
  prot: z.number(), // prot вместо protein
  carb: z.number(), // carb вместо carbs
  fat: z.number(),
})

const WebhookSchema = z.union([GetPhotosSchema, UpdateMealSchema])

// УБИРАЕМ ПРОВЕРКУ АУТЕНТИФИКАЦИИ для n8n webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = WebhookSchema.parse(body)

    const supabase = createSupabaseServerClient()

    if (validatedData.action === "get_photos") {
      // Получаем фотографии из logged_meals, которые еще не обработаны AI
      // ВАЖНО: Получаем ВСЕ записи, не привязываясь к конкретному пользователю
      const { data: meals, error } = await supabase
        .from("logged_meals")
        .select("*")
        .eq("source", "photo")
        .eq("grams", 0)
        .eq("calories", 0)
        .eq("protein", 0)
        .eq("carbs", 0)
        .eq("fat", 0)
        .not("photo_url", "is", null)
        .order("created_at", { ascending: true })
        .limit(validatedData.limit)

      if (error) {
        console.error("Error fetching photos:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      // Преобразуем в формат вашей схемы
      const adaptedMeals =
        meals?.map((meal) => ({
          id: meal.id,
          chat_id: meal.user_id, // используем user_id как chat_id
          dish: meal.dish_name,
          grams: meal.grams,
          kcal: meal.calories,
          prot: meal.protein,
          fat: meal.fat,
          carb: meal.carbs,
          eaten_at: meal.eaten_on_date,
          photo_url: meal.photo_url,
          source: meal.source,
        })) || []

      return NextResponse.json({
        success: true,
        meals: adaptedMeals,
        count: adaptedMeals.length,
      })
    }

    if (validatedData.action === "update_meal") {
      // Обновляем запись после AI анализа
      const { error } = await supabase
        .from("logged_meals")
        .update({
          dish_name: validatedData.dish,
          grams: validatedData.grams,
          calories: validatedData.kcal,
          protein: validatedData.prot,
          carbs: validatedData.carb,
          fat: validatedData.fat,
        })
        .eq("id", validatedData.meal_id)

      if (error) {
        console.error("Error updating meal:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Meal updated successfully",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

// Также поддерживаем GET для тестирования
export async function GET() {
  return NextResponse.json({
    message: "n8n webhook endpoint is working",
    endpoints: {
      get_photos: {
        method: "POST",
        body: {
          action: "get_photos",
          limit: 10, // optional
        },
      },
      update_meal: {
        method: "POST",
        body: {
          action: "update_meal",
          meal_id: "string",
          dish: "string", // изменено с dish_name
          grams: "number",
          kcal: "number", // изменено с calories
          prot: "number", // изменено с protein
          carb: "number", // изменено с carbs
          fat: "number",
        },
      },
    },
  })
}
