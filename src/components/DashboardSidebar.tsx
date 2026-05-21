import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Heart, MessageSquare, Wallet, Wifi, Receipt, Bell,
  Building2, Plus, BarChart3, Home as HomeIcon, Settings,
} from "lucide-react";

type Item = { title: string; to: string; tab?: string; icon: any };

const tenantItems: Item[] = [
  { title: "Overview", to: "/dashboard/tenant", tab: "favorites", icon: LayoutDashboard },
  { title: "Browse", to: "/dashboard/tenant", tab: "browse", icon: HomeIcon },
  { title: "Favorites", to: "/dashboard/tenant", tab: "favorites", icon: Heart },
  { title: "Inquiries", to: "/dashboard/tenant", tab: "inquiries", icon: MessageSquare },
  { title: "Rent payments", to: "/dashboard/tenant", tab: "payments", icon: Wallet },
  { title: "WiFi", to: "/dashboard/tenant", tab: "wifi", icon: Wifi },
  { title: "Receipts", to: "/dashboard/receipts", icon: Receipt },
  { title: "Reminders", to: "/dashboard/reminders", icon: Bell },
  { title: "Account", to: "/dashboard/account", icon: Settings },
];

const landlordItems: Item[] = [
  { title: "Overview", to: "/dashboard/landlord", tab: "listings", icon: LayoutDashboard },
  { title: "Listings", to: "/dashboard/landlord", tab: "listings", icon: Building2 },
  { title: "New listing", to: "/dashboard/new", icon: Plus },
  { title: "Inquiries", to: "/dashboard/landlord", tab: "inquiries", icon: MessageSquare },
  { title: "Tracker", to: "/dashboard/landlord", tab: "tracker", icon: BarChart3 },
  { title: "Receipts", to: "/dashboard/receipts", icon: Receipt },
  { title: "Reminders", to: "/dashboard/reminders", icon: Bell },
  { title: "Account", to: "/dashboard/account", icon: Settings },
];

export function DashboardSidebar() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchTab = useRouterState({ select: (s) => (s.location.search as any)?.tab as string | undefined });

  const items = role === "landlord" ? landlordItems : tenantItems;
  const isActive = (item: Item) => {
    if (pathname !== item.to) return false;
    if (!item.tab) return true;
    return (searchTab ?? (item.to.endsWith("/tenant") ? "favorites" : "listings")) === item.tab;
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
                  <SidebarMenuButton asChild isActive={isActive(item)}>
                    <Link
                      to={item.to}
                      search={item.tab ? { tab: item.tab } : undefined as any}
                      className="flex items-center gap-2"
                    >
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
                <SidebarMenuButton asChild isActive={pathname === "/properties"}>
                  <Link to="/properties" className="flex items-center gap-2">
                    <HomeIcon className="h-4 w-4" />
                    {!collapsed && <span>Browse all</span>}
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
