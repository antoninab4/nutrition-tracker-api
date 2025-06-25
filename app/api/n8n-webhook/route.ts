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
  // Устанавливаем CORS заголовки
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  }

  try {
    console.log("🔥 N8N Webhook called at:", new Date().toISOString())

    const body = await request.json()
    console.log("📥 Request body:", JSON.stringify(body, null, 2))

    const validatedData = WebhookSchema.parse(body)

    const supabase = createSupabaseServerClient()

    if (validatedData.action === "get_photos") {
      console.log("🔍 Fetching photos from database...")

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
        console.error("❌ Database error:", error)
        return NextResponse.json(
          { error: "Database error", details: error.message },
          { status: 500, headers: corsHeaders },
        )
      }

      console.log(`📊 Found ${meals?.length || 0} meals`)

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

      const response = {
        success: true,
        meals: adaptedMeals,
        count: adaptedMeals.length,
        timestamp: new Date().toISOString(),
      }

      console.log("📤 Sending response:", JSON.stringify(response, null, 2))
      return NextResponse.json(response, { headers: corsHeaders })
    }

    if (validatedData.action === "update_meal") {
      console.log("🔄 Updating meal:", validatedData.meal_id)

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
        console.error("❌ Update error:", error)
        return NextResponse.json(
          { error: "Database error", details: error.message },
          { status: 500, headers: corsHeaders },
        )
      }

      console.log("✅ Meal updated successfully")

      return NextResponse.json(
        {
          success: true,
          message: "Meal updated successfully",
          timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders },
      )
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders })
  } catch (error) {
    console.error("💥 Webhook error:", error)
    return NextResponse.json(
      {
        error: "Invalid request",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 400, headers: corsHeaders },
    )
  }
}

export async function GET() {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  }

  return NextResponse.json(
    {
      message: "N8N Webhook API is working",
      path: "/api/n8n-webhook",
      timestamp: new Date().toISOString(),
      status: "healthy",
    },
    { headers: corsHeaders },
  )
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
