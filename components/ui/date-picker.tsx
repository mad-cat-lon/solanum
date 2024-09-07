"use client"
 
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  label?: string; // Add a label or placeholder prop
  selectedDate?: Date; // Prop to control the selected date from parent
  onSelect?: (date: Date | undefined) => void; // Callback when date is selected
}



function DatePicker({ label, selectedDate, onSelect }: DatePickerProps ) {
  const [date, setDate] = React.useState<Date>()

  const handleDateSelect = (selected: Date | undefined) => {
    setDate(selected);
    if (onSelect) onSelect(selected); // Call parent callback
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{label || "Pick a date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }