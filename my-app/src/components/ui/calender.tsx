"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css" // 👈 Load default styles

export default function SimpleCalendar() {
  const [selected, setSelected] = React.useState<Date | undefined>()

  return (
    <div className="p-4 bg-white dark:bg-zinc-900 rounded-md">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
        fromDate={new Date()} // disable past dates if needed
      />
      {selected && (
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Selected date: {selected.toDateString()}
        </p>
      )}
    </div>
  )
}