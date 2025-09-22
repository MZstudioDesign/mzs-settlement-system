'use client'

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({
  items,
  className,
  showHome = true
}: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: "홈", href: "/", icon: Home }, ...items]
    : items;

  return (
    <nav
      aria-label="페이지 경로"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <ol className="flex items-center space-x-1 min-w-0">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center min-w-0">
              {index > 0 && (
                <ChevronRight
                  className="mx-2 h-4 w-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <div
                  className={cn(
                    "flex items-center min-w-0",
                    isLast
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && (
                    <Icon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center min-w-0 hover:text-foreground transition-colors",
                    "focus-brand rounded-sm px-1 py-0.5 -mx-1 -my-0.5",
                    "text-muted-foreground"
                  )}
                >
                  {Icon && (
                    <Icon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// 프리셋 브레드크럼 훅
export function useBreadcrumb() {
  const createBreadcrumb = (
    segments: Array<{ label: string; href?: string }>
  ): BreadcrumbItem[] => {
    return segments.map((segment) => ({
      label: segment.label,
      href: segment.href,
    }));
  };

  return {
    createBreadcrumb,
    // 공통 경로들
    calculator: createBreadcrumb([{ label: "정산 계산기" }]),
    team: createBreadcrumb([{ label: "팀원 관리" }]),
    projects: createBreadcrumb([{ label: "프로젝트 현황" }]),
    analytics: createBreadcrumb([{ label: "통계 분석" }]),
    projectDetail: (projectName: string) =>
      createBreadcrumb([
        { label: "프로젝트 현황", href: "/projects" },
        { label: projectName },
      ]),
    teamMember: (memberName: string) =>
      createBreadcrumb([
        { label: "팀원 관리", href: "/team" },
        { label: memberName },
      ]),
  };
}