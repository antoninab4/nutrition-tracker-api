import { createSupabaseServerClient } from "@/lib/supabase/server" // <--- Убедитесь, что импорт правильный
import { LogMealForm } from "@/components/dashboard/log-meal-form"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { deleteLoggedMeal } from "./actions"
import { Button } from "@/components/ui/button" // Убедитесь, что импорт есть
import Image from "next/image"

async function getTodaysLoggedMeals(userId: string) {
  const supabase = await createSupabaseServerClient() // <--- Убедитесь, что вызов правильный
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("logged_meals")
    .select("*")
    .eq("user_id", userId)
    .eq("eaten_on_date", today)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching today's meals:", error)
    return []
  }
  return data
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient() // <--- Убедитесь, что вызов правильный
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const todaysMeals = await getTodaysLoggedMeals(user.id)

  const mealTypeTranslations: { [key: string]: string } = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
    snack: "Перекус",
  }

  // Функция для определения статуса обработки
  const getMealStatus = (meal: any) => {
    if (meal.source === "photo") {
      // Если это фото и данные еще не обработаны (все равны 0)
      if (meal.grams === 0 && meal.calories === 0 && meal.protein === 0 && meal.carbs === 0 && meal.fat === 0) {
        return { status: "waiting", text: "Ожидает AI анализа", variant: "secondary" as const }
      } else {
        // Если данные обработаны AI
        return { status: "processed", text: "Обработано AI", variant: "default" as const }
      }
    }
    // Если введено вручную
    return { status: "manual", text: "Введено вручную", variant: "outline" as const }
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Ваш Дневник Питания</h1>
        <p className="text-muted-foreground">
          Добро пожаловать, {user.email}! Здесь вы можете отслеживать свои приемы пищи.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-1">
          <LogMealForm />
        </section>

        <section className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">
            Сегодняшние приемы пищи ({format(new Date(), "PPP", { locale: ru })})
          </h2>
          {todaysMeals.length > 0 ? (
            <Table>
              <TableCaption>Список приемов пищи за сегодня.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Фото</TableHead>
                  <TableHead>Блюдо</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="text-right">Вес (г)</TableHead>
                  <TableHead className="text-right">Ккал</TableHead>
                  <TableHead className="text-right">Б (г)</TableHead>
                  <TableHead className="text-right">Ж (г)</TableHead>
                  <TableHead className="text-right">У (г)</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysMeals.map((meal) => {
                  const mealStatus = getMealStatus(meal)
                  return (
                    <TableRow key={meal.id}>
                      <TableCell>
                        {meal.photo_url ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={meal.photo_url || "/placeholder.svg"}
                              alt={meal.dish_name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Нет фото</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{meal.dish_name}</div>
                          <Badge variant={mealStatus.variant} className="mt-1 text-xs">
                            {mealStatus.text}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mealTypeTranslations[meal.meal_type] || meal.meal_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{meal.grams || "—"}</TableCell>
                      <TableCell className="text-right">{meal.calories || "—"}</TableCell>
                      <TableCell className="text-right">{meal.protein || "—"}</TableCell>
                      <TableCell className="text-right">{meal.fat || "—"}</TableCell>
                      <TableCell className="text-right">{meal.carbs || "—"}</TableCell>
                      <TableCell className="text-right">
                        <form
                          action={async () => {
                            // Это Server Action, вызываемый напрямую
                            "use server" // Директива для inline Server Action
                            const result = await deleteLoggedMeal(meal.id)
                            // Обработка результата (например, toast) здесь не сработает напрямую,
                            // так как это серверный контекст.
                            // Для toast'ов после удаления лучше использовать redirect с query параметром
                            // или вынести строку таблицы в клиентский компонент.
                            // Пока что revalidatePath в deleteLoggedMeal обновит список.
                          }}
                        >
                          <Button type="submit" variant="destructive" size="sm">
                            Удалить
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">За сегодня еще нет записей. Добавьте свой первый прием пищи!</p>
          )}
        </section>
      </div>
    </div>
  )
}
