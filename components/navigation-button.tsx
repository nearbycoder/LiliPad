"use client";
import type { ComponentProps } from "react";
import { useSidebar } from "@/components/ui/sidebar";
export function NavigationButton({onClick,...props}:ComponentProps<"button">) {
  const {isMobile,setOpenMobile}=useSidebar();
  return <button {...props} onClick={event=>{onClick?.(event);if(isMobile)setOpenMobile(false);}}/>;
}
