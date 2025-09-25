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
  Settings,
  DollarSign,
  UserCheck,
  PieChart,
  CreditCard,
  Building,
  TrendingUp,
  Package,
  Briefcase,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface DesktopSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    label: "대시보드",
    href: "/",
    icon: Home,
    description: "KPI 현황 및 통계",
    category: "main"
  },
  {
    label: "프로젝트",
    href: "/projects",
    icon: FileText,
    description: "프로젝트 관리 및 정산",
    category: "work",
    notifications: 0
  },
  {
    label: "컨택 관리",
    href: "/contacts",
    icon: UserCheck,
    description: "고객 컨택 이벤트",
    category: "work"
  },
  {
    label: "피드 관리",
    href: "/feed",
    icon: TrendingUp,
    description: "피드백 활동 및 보상",
    category: "work"
  },
  {
    label: "팀 관리",
    href: "/team",
    icon: Users,
    description: "팀원 및 업무 관리",
    category: "team"
  },
  {
    label: "자금 관리",
    href: "/funds",
    icon: DollarSign,
    description: "회사 고정비 및 개인 보조금",
    category: "finance"
  },
  {
    label: "정산 관리",
    href: "/settlements",
    icon: Calculator,
    description: "월별 정산 생성 및 관리",
    category: "finance"
  },
  {
    label: "설정",
    href: "/settings",
    icon: Settings,
    description: "시스템 설정 및 관리",
    category: "admin"
  }
];

const categoryConfig = {
  main: { label: "메인", color: "text-primary" },
  work: { label: "작업 관리", color: "text-blue-600" },
  team: { label: "팀 관리", color: "text-green-600" },
  finance: { label: "정산 관리", color: "text-orange-600" },
  admin: { label: "시스템", color: "text-purple-600" }
};

export function DesktopSidebar({ className }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <Sidebar className={cn("border-r border-sidebar-border", className)}>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">M</span>
          </div>
          {state === "expanded" && (
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sidebar-foreground truncate">
                MZS 스튜디오
              </h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                정산 관리 시스템
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent>
        <div className="px-3 py-2">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              {/* Category Label */}
              {state === "expanded" && (
                <div className="px-3 mb-2">
                  <h3 className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    categoryConfig[category as keyof typeof categoryConfig]?.color || "text-sidebar-foreground/60"
                  )}>
                    {categoryConfig[category as keyof typeof categoryConfig]?.label || category}
                  </h3>
                </div>
              )}

              {/* Navigation Items */}
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.href}
                          className="group relative flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors"
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {state === "expanded" && (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm truncate block">
                                  {item.label}
                                </span>
                                <span className="text-xs text-sidebar-foreground/60 truncate block">
                                  {item.description}
                                </span>
                              </div>
                              {item.notifications && item.notifications > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto h-5 min-w-[1.25rem] px-1 text-xs"
                                >
                                  {item.notifications > 99 ? "99+" : item.notifications}
                                </Badge>
                              )}
                            </>
                          )}

                          {/* Collapsed state tooltip indicator */}
                          {state === "collapsed" && (
                            <div className="sr-only">{item.label}</div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          ))}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Building className="h-4 w-4 text-muted-foreground" />
          </div>
          {state === "expanded" && (
            <div className="flex-1 min-w-0">
              <div className="text-xs text-sidebar-foreground/80">
                시스템 상태: <span className="text-green-600 font-medium">정상</span>
              </div>
              <div className="text-xs text-sidebar-foreground/60">
                v1.0.0 - {new Date().getFullYear()}
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}