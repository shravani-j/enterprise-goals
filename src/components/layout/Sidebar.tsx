"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, Users, Settings, Activity, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { name: "My Goals", href: "/dashboard/goals", icon: Target, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { name: "Reports & Governance", href: "/dashboard/governance", icon: BarChart3, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { name: "System Logs", href: "/admin", icon: Activity, roles: ["ADMIN"] },
  ];

  return (
    <div className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <div className="font-poppins font-bold text-xl tracking-tight text-zinc-900">
          Enterprise<span className="text-[var(--color-dijon)]">Goals</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.roles.includes(role)).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive 
                  ? "bg-[var(--color-mimosa)]/20 text-[var(--color-dijon)]" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
