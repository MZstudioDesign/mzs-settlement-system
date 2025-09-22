'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus,
  Calculator,
  MessageSquare,
  Star,
  X,
  Users,
  FileText,
  TrendingUp
} from "lucide-react";

interface FABAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  mainIcon?: React.ComponentType<{ className?: string }>;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  hideOnScroll?: boolean;
  expandDirection?: 'up' | 'up-left' | 'up-right' | 'left' | 'right';
  className?: string;
}

export function FloatingActionButton({
  actions,
  mainIcon: MainIcon = Plus,
  position = 'bottom-right',
  size = 'md',
  hideOnScroll = false,
  expandDirection = 'up',
  className
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 시 FAB 숨김/표시 처리
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 아래로 스크롤 시 숨김
        setIsVisible(false);
        setIsExpanded(false);
      } else {
        // 위로 스크롤 시 표시
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isExpanded]);

  const sizeConfig = {
    sm: {
      main: 'h-12 w-12',
      action: 'h-10 w-10',
      icon: 'h-5 w-5',
      actionIcon: 'h-4 w-4',
      spacing: 'space-y-2'
    },
    md: {
      main: 'h-14 w-14',
      action: 'h-12 w-12',
      icon: 'h-6 w-6',
      actionIcon: 'h-5 w-5',
      spacing: 'space-y-3'
    },
    lg: {
      main: 'h-16 w-16',
      action: 'h-14 w-14',
      icon: 'h-7 w-7',
      actionIcon: 'h-6 w-6',
      spacing: 'space-y-4'
    }
  };

  const positionConfig = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const getExpandClasses = () => {
    switch (expandDirection) {
      case 'up':
        return 'flex-col-reverse items-center';
      case 'up-left':
        return 'flex-col-reverse items-end';
      case 'up-right':
        return 'flex-col-reverse items-start';
      case 'left':
        return 'flex-row-reverse items-center';
      case 'right':
        return 'flex-row items-center';
      default:
        return 'flex-col-reverse items-center';
    }
  };

  const getActionPosition = (index: number) => {
    const isHorizontal = ['left', 'right'].includes(expandDirection);
    const spacing = size === 'sm' ? 12 : size === 'md' ? 16 : 20;

    if (isHorizontal) {
      return { transform: `translateX(${expandDirection === 'left' ? '-' : ''}${(index + 1) * spacing * 4}px)` };
    } else {
      return { transform: `translateY(-${(index + 1) * spacing * 4}px)` };
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300",
      positionConfig[position],
      !isVisible && "translate-y-20 opacity-0",
      className
    )}>
      <div className={cn("relative flex", getExpandClasses())}>
        {/* Action Buttons */}
        {isExpanded && (
          <div className={cn(
            "flex",
            getExpandClasses(),
            config.spacing,
            "mb-3"
          )}>
            {actions.map((action, index) => {
              const ActionIcon = action.icon;

              return (
                <div
                  key={action.id}
                  className="relative group"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    ...getActionPosition(index)
                  }}
                >
                  {/* Action Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      config.action,
                      "shadow-lg hover:shadow-xl transition-all duration-200",
                      "bg-white hover:bg-gray-50 border border-gray-200",
                      action.disabled && "opacity-50 cursor-not-allowed",
                      action.color
                    )}
                    onClick={() => {
                      if (!action.disabled) {
                        action.onClick();
                        setIsExpanded(false);
                      }
                    }}
                    disabled={action.disabled}
                    aria-label={action.label}
                  >
                    <ActionIcon className={config.actionIcon} />

                    {/* Badge */}
                    {action.badge && action.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {action.badge > 99 ? '99+' : action.badge}
                      </Badge>
                    )}
                  </Button>

                  {/* Tooltip */}
                  <div className={cn(
                    "absolute bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
                    "bottom-1/2 transform translate-y-1/2",
                    expandDirection === 'left' || position.includes('left') ? "left-full ml-2" : "right-full mr-2"
                  )}>
                    {action.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          className={cn(
            config.main,
            "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "focus-brand"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-label={isExpanded ? "메뉴 닫기" : "빠른 액션 메뉴 열기"}
          aria-expanded={isExpanded}
        >
          <div className={cn(
            "transition-transform duration-200",
            isExpanded && "rotate-45"
          )}>
            {isExpanded ? (
              <X className={config.icon} />
            ) : (
              <MainIcon className={config.icon} />
            )}
          </div>
        </Button>

        {/* Backdrop */}
        {isExpanded && (
          <div
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

// 프리셋 FAB 컴포넌트들
export function SettlementFAB({
  onCalculateSettlement,
  onAddContact,
  onAddFeed,
  onViewTeam,
  onViewAnalytics,
  contactCount = 0,
  feedCount = 0
}: {
  onCalculateSettlement: () => void;
  onAddContact: () => void;
  onAddFeed: () => void;
  onViewTeam: () => void;
  onViewAnalytics: () => void;
  contactCount?: number;
  feedCount?: number;
}) {
  const actions: FABAction[] = [
    {
      id: 'settlement',
      label: '정산 계산기',
      icon: Calculator,
      onClick: onCalculateSettlement,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600'
    },
    {
      id: 'contact',
      label: '컨택 입력',
      icon: MessageSquare,
      onClick: onAddContact,
      badge: contactCount,
      color: 'bg-green-50 hover:bg-green-100 text-green-600'
    },
    {
      id: 'feed',
      label: '피드 입력',
      icon: Star,
      onClick: onAddFeed,
      badge: feedCount,
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600'
    },
    {
      id: 'team',
      label: '팀원 관리',
      icon: Users,
      onClick: onViewTeam,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600'
    },
    {
      id: 'analytics',
      label: '통계 분석',
      icon: TrendingUp,
      onClick: onViewAnalytics,
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <FloatingActionButton
      actions={actions}
      position="bottom-right"
      size="md"
      hideOnScroll={true}
      expandDirection="up"
    />
  );
}

export function QuickProjectFAB({
  onNewProject,
  onQuickSettlement,
  onViewProjects
}: {
  onNewProject: () => void;
  onQuickSettlement: () => void;
  onViewProjects: () => void;
}) {
  const actions: FABAction[] = [
    {
      id: 'new-project',
      label: '새 프로젝트',
      icon: FileText,
      onClick: onNewProject,
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600'
    },
    {
      id: 'quick-settlement',
      label: '빠른 정산',
      icon: Calculator,
      onClick: onQuickSettlement,
      color: 'bg-green-50 hover:bg-green-100 text-green-600'
    },
    {
      id: 'view-projects',
      label: '프로젝트 목록',
      icon: FileText,
      onClick: onViewProjects,
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600'
    }
  ];

  return (
    <FloatingActionButton
      actions={actions}
      position="bottom-right"
      size="md"
      hideOnScroll={true}
      expandDirection="up"
    />
  );
}