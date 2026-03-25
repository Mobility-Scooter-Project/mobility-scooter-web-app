import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "~/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex h-full min-h-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "text-foreground inline-flex h-auto w-fit items-center justify-center flex-wrap content-start gap-y-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-body"
      className={cn("flex-1 min-h-0", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        `data-[state=active]:bg-accent dark:data-[state=active]:text-foreground hover:bg-accent focus-visible:border-ring 
        focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 
        text-foreground inline-flex flex-none items-center justify-center gap-1.5 rounded-full 
        border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out focus-visible:ring-[3px] 
        focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none 
        [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer`,
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("h-full outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsBody, TabsTrigger, TabsContent };