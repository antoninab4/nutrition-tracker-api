import { createSupabaseServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Схема для получения новых фотографий
const GetPhotosSchema = z.object({
  action: z.literal("get_photos"),
  limit: z.number().optional().default(10),
})

// Схема для обновления записи после AI анализа
const UpdateMealSchema = z.object({
  action: z.literal("update_meal"),
  meal_id: z.string(),
  dish: z.string(),
  grams: z.number(),
  kcal: z.number(),
  prot: z.number(),
  carb: z.number(),
  fat: z.number(),
})

const WebhookSchema = z.union([GetPhotosSchema, UpdateMealSchema])

// ПОЛНОСТЬЮ ПУБЛИЧНЫЙ API БЕЗ АУТЕНТИФИКАЦИИ
export async function POST(request: NextRequest) {
  // Добавляем CORS заголовки
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    const body = await request.json()
    const validatedData = WebhookSchema.parse(body)

    const supabase = createSupabaseServerClient()

    if (validatedData.action === "get_photos") {
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
        return NextResponse.json({ error: "Database error" }, { status: 500, headers })
      }

      const adaptedMeals =
        meals?.map((meal) => ({
          id: meal.id,
          chat_id: meal.user_id,
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

      return NextResponse.json(
        {
          success: true,
          meals: adaptedMeals,
          count: adaptedMeals.length,
        },
        { headers },
      )
    }

    if (validatedData.action === "update_meal") {
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
        return NextResponse.json({ error: "Database error" }, { status: 500, headers })
      }

      return NextResponse.json(
        {
          success: true,
          message: "Meal updated successfully",
        },
        { headers },
      )
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "n8n webhook endpoint is working",
    path: "/api/n8n-webhook",
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
