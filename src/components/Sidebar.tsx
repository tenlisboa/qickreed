"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  DocumentIcon,
  UserIcon,
  CogIcon,
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { getUserRole } from "@/utils/auth/admin";
import type { UserRole } from "@/types/database";

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
    // TODO: Implement logout functionality
    console.log("Logout clicked");
  };

  const navigationItems = getNavigationItems(userRole);

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-black">QickReed</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-gray-600 text-sm">
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
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-black"
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
      <div className="p-4 border-t border-gray-200">
        {/* User Info */}
        <div className="mb-3">
          {!isCollapsed ? (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-black">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`
            flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 
            hover:bg-gray-100 hover:text-black rounded-lg transition-colors
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
