"use client";

import {
  AcademicCapIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentIcon,
  HomeIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/(auth)/login/actions";
import type { UserRole } from "@/types/database";
import { getUserRole } from "@/utils/auth/admin";

interface SidebarProps {
  className?: string;
}

const getNavigationItems = (userRole: UserRole | null) => {
  const baseItems = [
    {
      name: "Meu Progresso",
      href: "/dashboard",
      icon: HomeIcon,
    },
    {
      name: "Diagnóstico",
      href: "/assessment",
      icon: DocumentIcon,
    },
    {
      name: "Treinamento",
      href: "/training",
      icon: AcademicCapIcon,
    },
  ];

  // Add admin item if user is admin
  if (userRole === "admin") {
    baseItems.push({
      name: "Admin",
      href: "/admin/texts",
      icon: ShieldCheckIcon,
    });
  }

  return baseItems;
};

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const navigationItems = getNavigationItems(userRole);

  return (
    <div
      className={`bg-white border-r-[3px] border-black flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b-[3px] border-black flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-black">QickReed</h1>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 border-[3px] border-black bg-white text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-black text-sm font-bold">
            {isCollapsed ? "→" : "←"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 border-[3px] border-black rounded-base text-sm font-bold text-black transition-brutal focus-brutal
                    ${
                      isActive
                        ? "bg-main shadow-brutal"
                        : "bg-white shadow-brutal-sm hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                    }
                    ${isCollapsed ? "justify-center" : ""}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-[3px] border-black">
        {/* User Info */}
        <div className="mb-3">
          {!isCollapsed ? (
            <div className="flex items-center">
              <div className="w-8 h-8 border-[3px] border-black bg-main rounded-base flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-black" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-black">John Doe</p>
                <p className="text-xs text-black/70">john@example.com</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-[3px] border-black bg-main rounded-base flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-black" />
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className={`
            flex items-center w-full px-3 py-2 border-[3px] border-black bg-white text-sm font-bold text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal
            ${isCollapsed ? "justify-center" : ""}
          `}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>
    </div>
  );
}
