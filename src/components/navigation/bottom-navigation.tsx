'use client'

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Home,
  Calculator,
  Users,
  BarChart3,
  FileText,
  MessageCircle,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      label: "홈",
      href: "/",
      icon: Home,
      notifications: 0,
    },
    {
      label: "프로젝트",
      href: "/projects",
      icon: FileText,
      notifications: 0,
    },
    {
      label: "컨택",
      href: "/contacts",
      icon: Users,
      notifications: 0,
    },
    {
      label: "팀",
      href: "/team",
      icon: MessageCircle,
      notifications: 0,
    },
    {
      label: "정산",
      href: "/settlements",
      icon: Calculator,
      notifications: 0,
    },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "safe-bottom", // iOS safe area support
        className
      )}
      role="tablist"
      aria-label="메인 네비게이션"
      data-testid="bottom-nav"
    >
      <div className="container mx-auto px-2 max-w-md">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                role="tab"
                aria-selected={isActive}
                aria-label={`${item.label}${item.notifications > 0 ? ` (${item.notifications}개 알림)` : ""}`}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-0 flex-1 h-full px-1 py-2",
                  "focus-brand rounded-lg transition-colors duration-200",
                  "touch-manipulation", // Optimizes touch handling on mobile
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "scale-110" : "scale-100"
                    )}
                  />
                  {item.notifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                    >
                      {item.notifications > 9 ? "9+" : item.notifications}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium mt-1 leading-none transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}