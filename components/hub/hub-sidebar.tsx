"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Calendar,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  Settings,
  Shield,
  Tag,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

import { HubGlobalSearch } from "@/components/hub/hub-global-search";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { HubAccess } from "@/lib/auth/types";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const managerMain: NavItem[] = [
  { href: "/hub", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hub/calendar", label: "Calendar", icon: Calendar },
  { href: "/hub/blocks", label: "Schedule", icon: CalendarClock },
  { href: "/hub/customers", label: "Customers", icon: Users },
  { href: "/hub/staff", label: "Staff", icon: UsersRound },
  { href: "/hub/catalog", label: "Catalog", icon: Package },
  { href: "/hub/promos", label: "Promo codes", icon: Tag },
  { href: "/hub/website-feedback", label: "Site feedback", icon: MessageSquare },
  { href: "/hub/reports", label: "Reports", icon: Wallet },
  { href: "/hub/settings", label: "Settings", icon: Settings },
];

const detailerLinks: NavItem[] = [
  { href: "/hub/calendar", label: "My schedule", icon: Calendar },
  { href: "/hub/pay", label: "My pay", icon: Wallet },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/hub") return pathname === "/hub";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(pathname, item.href)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function HubSidebar({ access }: { access: HubAccess }) {
  const pathname = usePathname();
  const mainLinks = access.isManager ? managerMain : detailerLinks;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-0.5 px-1 py-0.5 group-data-[collapsible=icon]:hidden">
          <span className="font-display text-xl tracking-[0.08em] text-primary">
            MANAGERS HUB
          </span>
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {access.profile.full_name || access.profile.email}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-primary/70">
            {access.profile.role} · Central
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.14em]">
            {access.isManager ? "Operations" : "My hub"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 pb-3 group-data-[collapsible=icon]:hidden">
              <HubGlobalSearch isManager={access.isManager} variant="sidebar" />
            </div>
            <NavItems items={mainLinks} />
          </SidebarGroupContent>
        </SidebarGroup>

        {access.isManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[9px] uppercase tracking-[0.14em]">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/hub/managers"}
                    tooltip="Hub access"
                  >
                    <Link href="/hub/managers">
                      <Shield />
                      <span>Hub access</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!access.isManager && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/hub/settings/appearance"}
                    tooltip="Hub colors"
                  >
                    <Link href="/hub/settings/appearance">
                      <Palette />
                      <span>Hub colors</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <form action="/auth/signout" method="post" className="w-full">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton type="submit" tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
