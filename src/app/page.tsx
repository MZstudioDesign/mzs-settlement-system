'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Award,
  Target,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Mock data - 실제 구현시 API에서 가져올 데이터
const mockDashboardData = {
  kpi: {
    thisMonth: {
      revenue: 45600000,
      projects: 12,
      settlement: 18240000,
      pending: 2340000
    },
    lastMonth: {
      revenue: 38900000,
      projects: 10,
      settlement: 15560000,
      pending: 1890000
    }
  },
  ranking: [
    { name: "오유택", code: "OY", revenue: 8200000, growth: 15.2, projects: 3 },
    { name: "이예천", code: "LE", revenue: 7800000, growth: 12.1, projects: 4 },
    { name: "김연지", code: "KY", revenue: 6900000, growth: -2.3, projects: 2 },
    { name: "김하늘", code: "KH", revenue: 6200000, growth: 8.7, projects: 3 },
    { name: "이정수", code: "IJ", revenue: 5400000, growth: 5.2, projects: 2 },
    { name: "박지윤", code: "PJ", revenue: 4800000, growth: 18.9, projects: 1 }
  ],
  recentActivities: [
    { type: "project", title: "브랜드 로고 디자인", member: "오유택", amount: 1200000, time: "2시간 전" },
    { type: "contact", title: "상담 문의", member: "이예천", amount: 1000, time: "4시간 전" },
    { type: "feed", title: "피드백 작업", member: "김연지", amount: 1000, time: "6시간 전" },
    { type: "settlement", title: "월별 정산 완료", member: "시스템", amount: 18240000, time: "1일 전" }
  ],
  monthlyGoal: {
    target: 50000000,
    current: 45600000,
    progress: 91.2
  }
};

export default function Dashboard() {
  const [data, setData] = useState(mockDashboardData);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const revenueGrowth = calculateGrowth(data.kpi.thisMonth.revenue, data.kpi.lastMonth.revenue);
  const projectsGrowth = calculateGrowth(data.kpi.thisMonth.projects, data.kpi.lastMonth.projects);
  const settlementGrowth = calculateGrowth(data.kpi.thisMonth.settlement, data.kpi.lastMonth.settlement);

  return (
    <MainLayout title="대시보드" subtitle={`${currentTime.toLocaleDateString('ko-KR')} ${currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}>
      <div className="space-y-8">
        {/* 환영 섹션 */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">안녕하세요! 👋</h1>
            <p className="text-lg text-muted-foreground">
              오늘도 좋은 하루 되세요. 이달의 성과를 확인해보세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                새 프로젝트
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settlements">
                <Calculator className="mr-2 h-4 w-4" />
                정산 생성
              </Link>
            </Button>
          </div>
        </section>

        {/* 월간 목표 진행률 */}
        <section>
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle>이달 목표</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {data.monthlyGoal.progress.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">현재 매출</span>
                <span className="font-medium">{formatCurrency(data.monthlyGoal.current)}</span>
              </div>
              <Progress value={data.monthlyGoal.progress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">목표 매출</span>
                <span className="font-medium">{formatCurrency(data.monthlyGoal.target)}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* KPI 카드 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이달 매출</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.kpi.thisMonth.revenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {revenueGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </span>
                <span className="ml-1">vs 지난달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 프로젝트</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.kpi.thisMonth.projects)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {projectsGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={projectsGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(projectsGrowth).toFixed(1)}%
                </span>
                <span className="ml-1">vs 지난달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">정산 완료</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.kpi.thisMonth.settlement)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {settlementGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={settlementGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(settlementGrowth).toFixed(1)}%
                </span>
                <span className="ml-1">vs 지난달</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미지급 금액</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.kpi.thisMonth.pending)}</div>
              <div className="text-xs text-muted-foreground">지급 대기 중</div>
            </CardContent>
          </Card>
        </section>

        {/* 성과 랭킹과 최근 활동 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 성과 랭킹 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>이달 성과 랭킹</CardTitle>
              </div>
              <CardDescription>2.5배 환산 기준 (디자이너 40% + 컨택/피드)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.ranking.map((member, index) => (
                <div key={member.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.projects}개 프로젝트</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatCurrency(member.revenue)}</p>
                    <div className="flex items-center text-xs">
                      {member.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={member.growth >= 0 ? "text-green-500" : "text-red-500"}>
                        {Math.abs(member.growth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>최근 활동</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${activity.type === 'project' ? 'bg-blue-100' :
                        activity.type === 'contact' ? 'bg-green-100' :
                        activity.type === 'feed' ? 'bg-purple-100' :
                        'bg-orange-100'}
                    `}>
                      {activity.type === 'project' ? <FileText className="h-4 w-4 text-blue-600" /> :
                       activity.type === 'contact' ? <Users className="h-4 w-4 text-green-600" /> :
                       activity.type === 'feed' ? <BarChart3 className="h-4 w-4 text-purple-600" /> :
                       <Calculator className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.member} • {activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatCurrency(activity.amount)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* 빠른 액션 */}
        <section className="bg-muted/50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
              <Link href="/projects/new">
                <Calculator className="h-6 w-6" />
                <span className="text-sm">새 프로젝트</span>
              </Link>
            </Button>
            <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
              <Link href="/contacts">
                <Users className="h-6 w-6" />
                <span className="text-sm">컨택 입력</span>
              </Link>
            </Button>
            <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
              <Link href="/feed">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">피드 입력</span>
              </Link>
            </Button>
            <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
              <Link href="/settlements">
                <FileText className="h-6 w-6" />
                <span className="text-sm">정산 생성</span>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}