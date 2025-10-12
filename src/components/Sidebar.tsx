"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    name: "Documents",
    href: "/documents",
    icon: "📄",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: "👤",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
];

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    // TODO: Implement logout functionality
    console.log("Logout clicked");
  };

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
                  <span className="text-base flex-shrink-0">{item.icon}</span>
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
                <span className="text-gray-600 text-sm">👤</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-black">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">👤</span>
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
          <span className="text-base flex-shrink-0">🚪</span>
          {!isCollapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>
    </div>
  );
}
