"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Folder tabs: the active tab shares the panel's surface and border, and its
// open bottom edge joins the panel below. The list's baseline is drawn by the
// inactive tabs and a trailing filler, so it survives horizontal scrolling.

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn("flex items-end", className)} {...props}>
      {children}
      <span aria-hidden="true" className="min-w-4 flex-1 self-stretch border-b border-hairline" />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative min-h-11 shrink-0 rounded-t-[10px] border border-transparent border-b-hairline px-4 py-2.5 font-sans text-base whitespace-nowrap text-sage-muted transition-colors outline-none hover:text-cream focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:rounded-full before:bg-gold before:opacity-0 before:transition-opacity",
        "data-[state=active]:border-hairline data-[state=active]:border-b-transparent data-[state=active]:bg-forest-panel data-[state=active]:text-cream data-[state=active]:before:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "rounded-b-card border border-t-0 border-hairline bg-forest-panel p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 lg:p-6",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
