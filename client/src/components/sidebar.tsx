"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Calendar,
  Clock,
  Home,
  ListTodo,
  Settings,
  Star,
  Users,
  X,
  LogOut,
  AlignRight,
  Loader2,
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
import useTaskStore from "@/store/taskStore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import api from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const logout = useAuthStore((state) => state.logout);
  const { state } = useSidebar();
  const user = useAuthStore((state) => state.user);
  // const clearTasks = useTaskStore((state) => state.clearTasks);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);
      const userId = useAuthStore.getState().userId;

      // Call the logout endpoint
      await api.post("/auth/logout", { userId });

      // Clear query cache
      queryClient.clear();

      // Clear local storage and state
      useAuthStore.getState().logout();
      useTaskStore.getState().clearTasks();

      // Navigate after all cleanup is done
      // navigate("/");
      setShouldRedirect(true);
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  }, [queryClient, isLoggingOut]);

  // Handle navigation after logout in useEffect
  useEffect(() => {
    if (shouldRedirect) {
      navigate("/");
      setShouldRedirect(false);
    }
  }, [shouldRedirect, navigate]);

  const navigation = {
    main: [
      {
        name: "Dashboard",
        icon: Home,
        path: "/dashboard",
        tooltip: "Dashboard",
      },
      {
        name: "Tasks",
        icon: ListTodo,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
      {
        name: "Calendar",
        icon: Calendar,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
      {
        name: "Team",
        icon: Users,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
    ],
    secondary: [
      {
        name: "Statistics",
        icon: Star,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
      {
        name: "History",
        icon: Clock,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
      {
        name: "Settings",
        icon: Settings,
        path: "#",
        disabled: true,
        tooltip: "In the works",
      },
      {
        name: "Log Out",
        icon: LogOut,
        path: "#",
        disabled: isLoggingOut,
        handleClick: handleLogout,
        tooltip: isLoggingOut ? "Loggin out" : "Log Out",
      },
    ],
  };

  const renderMenuButton = (item: any) => {
    if (item.handleClick) {
      return (
        <div
          className="flex w-full items-center gap-2 disabled:opacity-15"
          onClick={() => !item.disabled && item.handleClick()}
          role="button"
          tabIndex={item.disabled ? -1 : 0}
        >
          {item.name === "Log Out" && isLoggingOut ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <item.icon className="size-4 shrink-0" />
          )}
          <span className="truncate">
            {item.name === "Log Out" && isLoggingOut
              ? "Logging out..."
              : item.name}
          </span>
        </div>
      );
    }

    return item.disabled ? (
      <span className="flex w-full items-center gap-2 opacity-50 cursor-not-allowed">
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.name}</span>
      </span>
    ) : (
      <Link to={item.path}>
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <X className="size-10" />
        ) : (
          <AlignRight className="size-10" />
        )}
      </Button>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <div className="hidden">
            <div className="p-4 ">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Access your dashboard, tasks, and account settings
              </SheetDescription>
            </div>
          </div>
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
                          disabled={item.disabled}
                        >
                          {item.disabled ? (
                            <span className="flex w-full items-center gap-2 opacity-50 cursor-not-allowed">
                              <item.icon className="size-4 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </span>
                          ) : (
                            <Link to={item.path}>
                              <item.icon className="size-4" />
                              <span>{item.name}</span>
                            </Link>
                          )}
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
                          asChild={!item.handleClick}
                          isActive={location.pathname === item.path}
                          tooltip={
                            state === "collapsed" ? item.name : undefined
                          }
                        >
                          {renderMenuButton(item)}
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
                      <div className="w-full">
                        <div className="flex w-full items-center gap-2 p-2 cursor-pointer hover:bg-accent">
                          <Avatar className="size-8">
                            <AvatarImage
                              src={user?.image || "/placeholder.svg"}
                              alt={user?.username || "User"}
                            />
                            <AvatarFallback>
                              {user?.username?.[0] || "U"}
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
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">
                        {user?.username || "User Name"}
                      </p>
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
                        tooltip={
                          state === "collapsed" ? item.tooltip : undefined
                        }
                        disabled={item.disabled}
                      >
                        {item.disabled ? (
                          <span className="flex w-full items-center gap-2 opacity-50 cursor-not-allowed">
                            <item.icon className="size-4 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                        ) : (
                          <Link to={item.path}>
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                          </Link>
                        )}
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
                        asChild={!item.handleClick}
                        isActive={location.pathname === item.path}
                        tooltip={
                          state === "collapsed" ? item.tooltip : undefined
                        }
                      >
                        {renderMenuButton(item)}
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
                    {/* <div className="cursor-pointer"> */}
                    <SidebarTrigger />
                    {/* </div> */}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      {state === "collapsed" ? "Open Sidebar" : "Close Sidebar"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* <div className="w-full"> */}
                    <SidebarMenuButton size="default">
                      {/* <div className="flex w-full items-center gap-2 p-2 cursor-pointer hover:bg-accent"> */}
                      <Avatar className="size-4">
                        <AvatarImage
                          src={user?.image || "/placeholder.svg"}
                          alt={user?.username || "User"}
                        />
                        <AvatarFallback>
                          {user?.username?.[0] || "U"}
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
                      {/* </div> */}
                    </SidebarMenuButton>
                    {/* </div> */}
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="hidden group-data-[state=collapsed]:block"
                  >
                    <p className="font-medium">
                      {user?.username || "User Name"}
                    </p>
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
