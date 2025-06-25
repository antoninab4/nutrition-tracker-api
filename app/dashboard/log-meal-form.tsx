"use client"

import { useActionState, useEffect, useRef } from "react"
import { addLoggedMeal, type FormState } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast" // Используем ваш хук для тостов

const initialState: FormState = {
  message: "",
  success: false,
}

export function LogMealForm() {
  const [state, formAction, isPending] = useActionState(addLoggedMeal, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Успех!" : "Ошибка",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      })
      if (state.success) {
        formRef.current?.reset()
        // Если у вас есть DatePicker, его сброс может потребовать отдельной логики
        // Например, если DatePicker управляется состоянием, нужно сбросить это состояние
      }
    }
  }, [state, toast])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Добавить прием пищи</CardTitle>
        <CardDescription>Заполните детали вашего приема пищи.</CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dish_name">Название блюда/продукта</Label>
            <Input id="dish_name" name="dish_name" placeholder="Например, Куриная грудка с рисом" required />
            {state.errors?.dish_name && <p className="text-sm text-red-500">{state.errors.dish_name.join(", ")}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grams">Вес (г)</Label>
              <Input id="grams" name="grams" type="number" placeholder="150" required step="0.1" />
              {state.errors?.grams && <p className="text-sm text-red-500">{state.errors.grams.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Калории (ккал)</Label>
              <Input id="calories" name="calories" type="number" placeholder="250" required step="0.1" />
              {state.errors?.calories && <p className="text-sm text-red-500">{state.errors.calories.join(", ")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Белки (г)</Label>
              <Input id="protein" name="protein" type="number" placeholder="30" required step="0.1" />
              {state.errors?.protein && <p className="text-sm text-red-500">{state.errors.protein.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Углеводы (г)</Label>
              <Input id="carbs" name="carbs" type="number" placeholder="40" required step="0.1" />
              {state.errors?.carbs && <p className="text-sm text-red-500">{state.errors.carbs.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Жиры (г)</Label>
              <Input id="fat" name="fat" type="number" placeholder="10" required step="0.1" />
              {state.errors?.fat && <p className="text-sm text-red-500">{state.errors.fat.join(", ")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal_type">Тип приема пищи</Label>
              <Select name="meal_type" defaultValue="lunch" required>
                <SelectTrigger id="meal_type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Завтрак</SelectItem>
                  <SelectItem value="lunch">Обед</SelectItem>
                  <SelectItem value="dinner">Ужин</SelectItem>
                  <SelectItem value="snack">Перекус</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.meal_type && <p className="text-sm text-red-500">{state.errors.meal_type.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eaten_on_date">Дата приема пищи</Label>
              {/* 
                Для DatePicker:
                Вам нужно будет передать name="eaten_on_date" в DatePicker.
                DatePicker должен как-то записывать выбранную дату в скрытое поле
                или управляться через состояние, которое потом передается в FormData.
                Простейший вариант - использовать стандартный <Input type="date">,
                но DatePicker из shadcn/ui будет выглядеть лучше.
                Пока что для простоты можно использовать Input type="date".
              */}
              <Input
                id="eaten_on_date"
                name="eaten_on_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
              {state.errors?.eaten_on_date && (
                <p className="text-sm text-red-500">{state.errors.eaten_on_date.join(", ")}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Добавление..." : "Добавить прием пищи"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
