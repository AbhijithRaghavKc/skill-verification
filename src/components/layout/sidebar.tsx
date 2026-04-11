"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  FileCheck,
  Briefcase,
  User,
  Settings,
  Shield,
  BarChart3,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: string;
};

const candidateNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Credentials", href: "/credentials", icon: Award },
  { name: "Assessments", href: "/assessments", icon: FileCheck },
  { name: "Job Matches", href: "/jobs", icon: Briefcase },
  { name: "Blockchain", href: "/verify", icon: LinkIcon },
  { name: "Profile", href: "/profile", icon: User },
];

const employerNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Job Postings", href: "/jobs", icon: Briefcase },
  { name: "Candidates", href: "/jobs?tab=candidates", icon: Users },
  { name: "Analytics", href: "/dashboard?tab=analytics", icon: BarChart3 },
  { name: "Verify", href: "/verify", icon: Shield },
  { name: "Profile", href: "/profile", icon: User },
];

const institutionNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Issue Credentials", href: "/credentials", icon: Award },
  { name: "Assessments", href: "/assessments", icon: FileCheck },
  { name: "Manage", href: "/dashboard?tab=manage", icon: Settings },
  { name: "Blockchain", href: "/verify", icon: LinkIcon },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "employer"
      ? employerNav
      : role === "institution"
      ? institutionNav
      : candidateNav;

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-gray-50">
      <div className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
