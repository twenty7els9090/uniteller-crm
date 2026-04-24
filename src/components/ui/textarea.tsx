import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/60 flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2",
        "text-base shadow-xs transition-[border-color,box-shadow] outline-none",
        "focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
        "aria-invalid:border-destructive/60",
        className,
      )}
      {...props}
    />
  )
}
export { Textarea }
