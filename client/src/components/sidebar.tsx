"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Brain,
  Calendar,
  Clock,
  Home,
  ListTodo,
  Settings,
  Star,
  Users,
  Menu,
  X,
} from "lucide-react";

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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  // TooltipProvider,
} from "@/components/ui/tooltip";
import useAuthStore from "@/store/authstore";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navigation = {
  main: [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Tasks", icon: ListTodo, path: "/tasks" },
    { name: "Calendar", icon: Calendar, path: "/calendar" },
    { name: "Team", icon: Users, path: "/team" },
  ],
  secondary: [
    { name: "Statistics", icon: Star, path: "/stats" },
    { name: "History", icon: Clock, path: "/history" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ],
};

export function DashboardSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="size-6" />
        ) : (
          <Menu className="size-6" />
        )}
      </Button>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <div className="h-full overflow-y-auto">
            <SidebarHeader className="mt-16">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Brain className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">TaskWise</span>
                      <span className="text-xs text-muted-foreground">
                        AI-Powered Tasks
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigation.main.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to={item.path}>
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Other</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigation.secondary.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link to={item.path}>
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton size="lg">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={user?.image || "/placeholder.svg"}
                            alt={user?.name || "User"}
                          />
                          <AvatarFallback>
                            {user?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5 leading-none">
                          <span className="font-medium">
                            {user?.username || "User Name"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user?.email || "user@example.com"}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{user?.name || "User Name"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Brain className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">TaskWise</span>
                    <span className="text-xs text-muted-foreground">
                      AI-Powered Tasks
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.main.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.path}
                        tooltip={state === "collapsed" ? item.name : undefined}
                      >
                        <Link to={item.path}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Other</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.secondary.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.path}
                        tooltip={state === "collapsed" ? item.name : undefined}
                      >
                        <Link to={item.path}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarTrigger />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={user?.image || "/placeholder.svg"}
                          alt={user?.name || "User"}
                        />
                        <AvatarFallback>
                          {user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-medium">
                          {user?.name || "User Name"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email || "user@example.com"}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="hidden group-data-[state=collapsed]:block"
                  >
                    <p className="font-medium">{user?.name || "User Name"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
      </div>
    </>
  );
}
