'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
      label: "프로젝트",
      href: "/projects",
      icon: FileText,
      description: "프로젝트 관리 및 정산"
    },
    {
      label: "컨택",
      href: "/contacts",
      icon: Users,
      description: "고객 컨택 이벤트 관리"
    },
    {
      label: "피드",
      href: "/feed",
      icon: BarChart3,
      description: "피드백 활동 및 보상"
    },
    {
      label: "팀 관리",
      href: "/team",
      icon: Users,
      description: "팀원 및 업무 관리"
    },
    {
      label: "자금 관리",
      href: "/funds",
      icon: Calculator,
      description: "회사 고정비 및 개인 보조금"
    },
    {
      label: "정산 관리",
      href: "/settlements",
      icon: Calculator,
      description: "월별 정산 생성 및 관리"
    },
    {
      label: "설정",
      href: "/settings",
      icon: Settings,
      description: "시스템 설정 및 관리"
    }
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
                className="focus-brand relative z-50 min-h-[44px] min-w-[44px]"
                aria-label="메뉴 열기"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 sm:w-96">
              <SheetTitle className="sr-only">메인 메뉴</SheetTitle>
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
                        className="block group"
                      >
                        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent/50 active:bg-accent transition-all duration-200 focus-brand group-active:scale-[0.98]">
                          <div className="p-2 rounded-lg bg-accent/30 group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</p>
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