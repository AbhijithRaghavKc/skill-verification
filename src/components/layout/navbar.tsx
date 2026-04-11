"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Shield,
  LayoutDashboard,
  Award,
  FileCheck,
  Briefcase,
  User,
  Menu,
  X,
  LogOut,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarProps = {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
};

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Credentials", href: "/credentials", icon: Award },
  { name: "Assessments", href: "/assessments", icon: FileCheck },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Verify", href: "/verify", icon: Shield },
  { name: "Profile", href: "/profile", icon: User },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string }[]>([]);

  const navigation = user?.role === "admin"
    ? [...baseNavigation, { name: "Admin", href: "/admin", icon: Settings }]
    : baseNavigation;

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setUnreadCount(data.data.unreadCount);
            setNotifs(data.data.notifications?.slice(0, 10) || []);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnreadCount(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                SkillChain
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex md:items-center md:gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex md:items-center md:gap-4">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotifs && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-gray-400">
                            No notifications
                          </p>
                        ) : (
                          notifs.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "border-b border-gray-50 px-4 py-3 text-sm",
                                !n.isRead && "bg-blue-50"
                              )}
                            >
                              <p className="font-medium text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
                <Link href="/api/auth/signout">
                  <Button variant="ghost" size="icon">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}

            <button
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && user && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
