import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Heart, MessageSquare, Wallet, Wifi, Receipt, Bell,
  Building2, Plus, BarChart3, Home as HomeIcon,
} from "lucide-react";

type Item = { title: string; url: string; icon: any };

const tenantItems: Item[] = [
  { title: "Overview", url: "/dashboard/tenant", icon: LayoutDashboard },
  { title: "Favorites", url: "/dashboard/tenant?tab=favorites", icon: Heart },
  { title: "Inquiries", url: "/dashboard/tenant?tab=inquiries", icon: MessageSquare },
  { title: "Rent payments", url: "/dashboard/tenant?tab=payments", icon: Wallet },
  { title: "WiFi", url: "/dashboard/tenant?tab=wifi", icon: Wifi },
  { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
  { title: "Reminders", url: "/dashboard/reminders", icon: Bell },
];

const landlordItems: Item[] = [
  { title: "Overview", url: "/dashboard/landlord", icon: LayoutDashboard },
  { title: "Listings", url: "/dashboard/landlord?tab=listings", icon: Building2 },
  { title: "New listing", url: "/dashboard/new", icon: Plus },
  { title: "Inquiries", url: "/dashboard/landlord?tab=inquiries", icon: MessageSquare },
  { title: "Tracker", url: "/dashboard/landlord?tab=tracker", icon: BarChart3 },
  { title: "Receipts", url: "/dashboard/receipts", icon: Receipt },
  { title: "Reminders", url: "/dashboard/reminders", icon: Bell },
];

export function DashboardSidebar() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = role === "landlord" ? landlordItems : tenantItems;
  const isActive = (url: string) => {
    const base = url.split("?")[0];
    return pathname === base;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role === "landlord" ? "Landlord" : "Tenant"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/properties" className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4" />
                    {!collapsed && <span>Browse</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
