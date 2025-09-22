import Link from 'next/link'
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, FileText, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8">
          {/* Welcome Section */}
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold">환영합니다! 👋</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              MZS 스튜디오 정산 시스템이 성공적으로 설정되었습니다.
              모바일 우선 설계로 언제 어디서나 정산 관리가 가능합니다.
            </p>
          </section>

          {/* Feature Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Calculator className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>자동 정산</CardTitle>
                <CardDescription>
                  부가세, 원천징수 3.3% 자동 계산
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 총입금 → 실입금 계산</li>
                  <li>• 디자이너 40% 분배</li>
                  <li>• 인센티브 0~20% 적용</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>팀원 관리</CardTitle>
                <CardDescription>
                  6명 디자이너 정산 관리
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 오유택, 이예천, 김연지</li>
                  <li>• 김하늘, 이정수, 박지윤</li>
                  <li>• 지분별 정산 분배</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>모바일 FAB</CardTitle>
                <CardDescription>
                  원탭으로 빠른 입력
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 컨택: 유입/상담/가이드</li>
                  <li>• 피드: 3개미만/3개이상</li>
                  <li>• 오프라인 캐시 지원</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle>실시간 대시보드</CardTitle>
                <CardDescription>
                  KPI 및 성과 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 월별 매출 현황</li>
                  <li>• 개인별 성과 랭킹</li>
                  <li>• 미지급 현황 추적</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions */}
          <section className="bg-muted/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">빠른 시작</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button className="justify-start" variant="outline" asChild>
                <Link href="/projects/new">
                  <Calculator className="mr-2 h-4 w-4" />
                  새 프로젝트 정산
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link href="/projects">
                  <Users className="mr-2 h-4 w-4" />
                  프로젝트 관리
                </Link>
              </Button>
              <Button className="justify-start" variant="outline" asChild>
                <Link href="/projects">
                  <FileText className="mr-2 h-4 w-4" />
                  프로젝트 목록
                </Link>
              </Button>
            </div>
          </section>

          {/* System Status */}
          <section className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">시스템 정상 운영 중</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Next.js 15 + Supabase + shadcn/ui로 구축됨
            </p>
          </section>
      </div>
    </MainLayout>
  );
}