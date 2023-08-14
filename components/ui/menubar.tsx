"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const MenubarMenu = MenubarPrimitive.Menu

const MenubarGroup = MenubarPrimitive.Group

const MenubarPortal = MenubarPrimitive.Portal

const MenubarSub = MenubarPrimitive.Sub

const MenubarRadioGroup = MenubarPrimitive.RadioGroup


const Menubar = React.forwardRef<React.ElementRef<typeof MenubarPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>>
(({ className, ...props }, ref) => (
    <MenubarPrimitive.Root
    ref={ref}
    className={cn(
        "flex h-10 items-center space-x-1 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950",
        className
    )}
    {...props}
     />
))

Menubar.displayName = MenubarPrimitive.Root.displayName


const MenubarTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>>
    (({ className, ...props }, ref) => (
        <MenubarPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-slate-100 focus:text-slate-900 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-50 dark:data-[state=open]:bg-slate-800 dark:data-[state=open]:text-slate-50", className)}
         {...props}
         />
    ))

    MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

export {
    Menubar,
    MenubarMenu,
    MenubarTrigger
}
