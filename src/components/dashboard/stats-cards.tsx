'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FolderCheck,
  Clock,
  Target,
  BarChart3
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

interface StatsCardsProps {
  data: {
    totalRevenue: {
      current: number;
      previous: number;
      period: string;
    };
    activeProjects: {
      count: number;
      completed: number;
      inProgress: number;
    };
    teamPerformance: {
      totalDesigners: number;
      activeDesigners: number;
      avgEarnings: number;
    };
    pendingPayments: {
      count: number;
      amount: number;
      overdue: number;
    };
  };
  period?: string;
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  className
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant={badge.variant || 'default'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              {trend.isPositive ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground ml-1">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ data, period = "이번 달" }: StatsCardsProps) {
  // 매출 증감률 계산
  const revenueGrowth = data.totalRevenue.previous > 0
    ? ((data.totalRevenue.current - data.totalRevenue.previous) / data.totalRevenue.previous) * 100
    : 0;

  // 프로젝트 완료율 계산
  const totalProjects = data.activeProjects.completed + data.activeProjects.inProgress;
  const completionRate = totalProjects > 0
    ? (data.activeProjects.completed / totalProjects) * 100
    : 0;

  // 활성 디자이너 비율
  const activeDesignerRate = data.teamPerformance.totalDesigners > 0
    ? (data.teamPerformance.activeDesigners / data.teamPerformance.totalDesigners) * 100
    : 0;

  const statsData = [
    {
      title: "총 매출",
      value: formatCurrency(data.totalRevenue.current),
      description: `${data.totalRevenue.period} 기준`,
      icon: DollarSign,
      trend: {
        value: Math.abs(revenueGrowth),
        label: "전월 대비",
        isPositive: revenueGrowth >= 0
      }
    },
    {
      title: "진행 프로젝트",
      value: data.activeProjects.count,
      description: `완료: ${data.activeProjects.completed}개, 진행중: ${data.activeProjects.inProgress}개`,
      icon: FolderCheck,
      badge: {
        text: `${completionRate.toFixed(0)}% 완료`,
        variant: completionRate >= 80 ? 'default' : completionRate >= 50 ? 'secondary' : 'outline' as const
      }
    },
    {
      title: "팀 현황",
      value: `${data.teamPerformance.activeDesigners}/${data.teamPerformance.totalDesigners}`,
      description: `평균 수익: ${formatCurrency(data.teamPerformance.avgEarnings)}`,
      icon: Users,
      trend: {
        value: activeDesignerRate,
        label: "활성 비율",
        isPositive: activeDesignerRate >= 70
      }
    },
    {
      title: "미지급 정산",
      value: data.pendingPayments.count,
      description: `총 ${formatCurrency(data.pendingPayments.amount)}`,
      icon: Clock,
      badge: data.pendingPayments.overdue > 0 ? {
        text: `${data.pendingPayments.overdue}개 지연`,
        variant: 'destructive' as const
      } : undefined
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}

// 추가 세부 통계 카드 컴포넌트
interface DetailedStatsProps {
  monthlyData: Array<{
    month: string;
    revenue: number;
    projects: number;
    designers: number;
  }>;
  topPerformers: Array<{
    name: string;
    earnings: number;
    projects: number;
    growth: number;
  }>;
}

export function DetailedStatsCards({ monthlyData, topPerformers }: DetailedStatsProps) {
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const monthlyGrowth = previousMonth
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0;

  const avgProjectValue = currentMonth.projects > 0
    ? currentMonth.revenue / currentMonth.projects
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 월별 성장률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">월별 성장률</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth.month} vs {previousMonth?.month || '전월'}
            </p>
            <div className="flex items-center text-xs">
              {monthlyGrowth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "font-medium",
                monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(Math.abs(currentMonth.revenue - (previousMonth?.revenue || 0)))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 평균 프로젝트 가치 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 프로젝트 가치</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatCurrency(avgProjectValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              총 {currentMonth.projects}개 프로젝트 기준
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">이번 달</span>
                <span className="font-mono">{formatCurrency(currentMonth.revenue)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최고 성과자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">최고 성과자</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPerformers.slice(0, 3).map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    index === 0 ? "bg-yellow-100 text-yellow-800" :
                    index === 1 ? "bg-gray-100 text-gray-800" :
                    "bg-orange-100 text-orange-800"
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {performer.projects}개 프로젝트
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{formatCurrency(performer.earnings)}</p>
                  <div className="flex items-center text-xs">
                    {performer.growth >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                    )}
                    <span className={cn(
                      performer.growth >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {performer.growth >= 0 ? '+' : ''}{performer.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}