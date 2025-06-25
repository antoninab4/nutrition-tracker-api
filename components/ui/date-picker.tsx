"use client"

import * as React from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  name?: string
}

export function DatePicker({ date, setDate, name }: DatePickerProps) {
  const hiddenInputRef = React.useRef<HTMLInputElement>(null)

  const handleDateSelect = (newDate?: Date) => {
    setDate(newDate)
    if (hiddenInputRef.current && newDate) {
      hiddenInputRef.current.value = format(newDate, "yyyy-MM-dd")
    } else if (hiddenInputRef.current) {
      hiddenInputRef.current.value = ""
    }
  }

  React.useEffect(() => {
    if (date && hiddenInputRef.current) {
      hiddenInputRef.current.value = format(date, "yyyy-MM-dd")
    } else if (!date && hiddenInputRef.current) {
      hiddenInputRef.current.value = new Date().toISOString().split("T")[0]
    }
  }, [date])

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ru }) : <span>Выберите дату</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus locale={ru} />
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          ref={hiddenInputRef}
          defaultValue={date ? format(date, "yyyy-MM-dd") : new Date().toISOString().split("T")[0]}
        />
      )}
    </>
  )
}
