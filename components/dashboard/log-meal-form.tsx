"use client"

import type React from "react"

import { useActionState, useEffect, useRef, useState } from "react"
import { addLoggedMeal, type FormState } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator" // <-- Добавим разделитель

const initialState: FormState = {
  message: "",
  success: false,
  photoReceived: false, // <-- Новое поле в состоянии
}

export function LogMealForm() {
  const [state, formAction, isPending] = useActionState(addLoggedMeal, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // <-- Ref для сброса файла
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success || state.photoReceived ? "Информация" : "Ошибка",
        description: state.message,
        variant: state.success || state.photoReceived ? "default" : "destructive",
      })
      if (state.success || state.photoReceived) {
        formRef.current?.reset()
        setSelectedDate(new Date())
        setSelectedFileName(null) // Сбрасываем имя файла
        if (fileInputRef.current) {
          fileInputRef.current.value = "" // Сбрасываем значение input type="file"
        }
      }
    }
  }, [state, toast])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      const maxSize = 10 * 1024 * 1024 // 10 МБ в байтах

      if (file.size > maxSize) {
        toast({
          title: "Файл слишком большой",
          description: "Размер файла не должен превышать 10 МБ. Пожалуйста, выберите другое изображение.",
          variant: "destructive",
        })
        // Сбрасываем выбор файла
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        setSelectedFileName(null)
        return
      }

      setSelectedFileName(file.name)
    } else {
      setSelectedFileName(null)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} ref={formRef}>
        <CardHeader>
          <CardTitle>Добавить прием пищи</CardTitle>
          <CardDescription>Загрузите фото или заполните детали вручную.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meal_photo">Фотография блюда (опционально)</Label>
            <Input
              id="meal_photo"
              name="meal_photo"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="mt-1"
            />
            {selectedFileName && <p className="text-sm text-muted-foreground mt-1">Выбран файл: {selectedFileName}</p>}
            {!selectedFileName && (
              <p className="text-sm text-muted-foreground mt-1">Максимальный размер файла: 10 МБ</p>
            )}
          </div>

          <div className="relative my-4">
            <Separator />
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-sm text-muted-foreground">ИЛИ</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish_name">Название блюда/продукта</Label>
            <Input id="dish_name" name="dish_name" placeholder="Например, Куриная грудка с рисом" />
            {state.errors?.dish_name && <p className="text-sm text-red-500">{state.errors.dish_name.join(", ")}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grams">Вес (г)</Label>
              <Input id="grams" name="grams" type="number" placeholder="150" step="0.1" />
              {state.errors?.grams && <p className="text-sm text-red-500">{state.errors.grams.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Калории (ккал)</Label>
              <Input id="calories" name="calories" type="number" placeholder="250" step="0.1" />
              {state.errors?.calories && <p className="text-sm text-red-500">{state.errors.calories.join(", ")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Белки (г)</Label>
              <Input id="protein" name="protein" type="number" placeholder="30" step="0.1" />
              {state.errors?.protein && <p className="text-sm text-red-500">{state.errors.protein.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Углеводы (г)</Label>
              <Input id="carbs" name="carbs" type="number" placeholder="40" step="0.1" />
              {state.errors?.carbs && <p className="text-sm text-red-500">{state.errors.carbs.join(", ")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Жиры (г)</Label>
              <Input id="fat" name="fat" type="number" placeholder="10" step="0.1" />
              {state.errors?.fat && <p className="text-sm text-red-500">{state.errors.fat.join(", ")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal_type">Тип приема пищи</Label>
              <Select name="meal_type" defaultValue="lunch">
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
              <DatePicker date={selectedDate} setDate={setSelectedDate} name="eaten_on_date" />
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
