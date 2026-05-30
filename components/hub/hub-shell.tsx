"use client";

import type { ReactNode } from "react";

import { HubSidebar } from "@/components/hub/hub-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { HubAccess } from "@/lib/auth/types";

export function HubShell({
  access,
  children,
}: {
  access: HubAccess;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider defaultOpen className="min-h-svh">
        <HubSidebar access={access} />
        <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-background">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
            <SidebarTrigger className="-ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
            <Separator orientation="vertical" className="mr-1 h-5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Managers hub
            </span>
          </header>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}
