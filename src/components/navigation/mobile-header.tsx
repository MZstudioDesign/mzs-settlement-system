'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Bell,
  Settings,
  Calculator,
  Users,
  BarChart3,
  FileText,
  Home
} from "lucide-react";
import Link from "next/link";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  notifications?: number;
}

export function MobileHeader({
  title = "MZS 스튜디오",
  subtitle = "정산 관리 시스템",
  notifications = 0
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: "대시보드",
      href: "/",
      icon: Home,
      description: "메인 대시보드 및 현황"
    },
    {
      label: "정산 계산기",
      href: "/calculator",
      icon: Calculator,
      description: "새 프로젝트 정산 계산"
    },
    {
      label: "팀원 관리",
      href: "/team",
      icon: Users,
      description: "디자이너 및 지분 관리"
    },
    {
      label: "프로젝트 현황",
      href: "/projects",
      icon: FileText,
      description: "진행중인 프로젝트 관리"
    },
    {
      label: "통계 분석",
      href: "/analytics",
      icon: BarChart3,
      description: "매출 및 성과 분석"
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold text-primary">{title}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative focus-brand"
            aria-label={`알림 ${notifications}개`}
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notifications > 99 ? "99+" : notifications}
              </Badge>
            )}
          </Button>

          {/* Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="focus-brand"
                aria-label="메뉴 열기"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">M</span>
                    </div>
                    <div>
                      <h2 className="font-semibold">MZS 스튜디오</h2>
                      <p className="text-sm text-muted-foreground">정산 관리 시스템</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block"
                      >
                        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors focus-brand">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start focus-brand"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}