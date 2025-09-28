'use client'

import { useEffect, useState, useCallback, memo } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileHeader } from "@/components/navigation/mobile-header";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Breadcrumb, BreadcrumbItem } from "@/components/navigation/breadcrumb";
import { QuickInputOverlay } from "@/components/overlays/quick-input-overlay";
import { ContactFeedModal } from "@/components/modals/contact-feed-modal";
import { cn, mobile, a11y } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { LazyPerformanceMonitor, LazyErrorMonitor } from "@/components/common/lazy-components";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { QuickLoggerFAB } from "@/components/fab/quick-logger-fab";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showFAB?: boolean;
  showBottomNav?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  notifications?: number;
}

type QuickInputType = 'contact' | 'feed' | 'settlement' | null;

// Desktop Header Component
const DesktopHeader = memo(({
  title,
  subtitle,
  breadcrumbs,
  notifications
}: {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  notifications?: number;
}) => {
  const { toggleSidebar, state } = useSidebar();
  const pathname = usePathname();

  // Generate title from pathname if not provided
  const pageTitle = title || (() => {
    const pathMap: Record<string, string> = {
      '/': '대시보드',
      '/projects': '프로젝트 관리',
      '/contacts': '컨택 관리',
      '/feed': '피드 관리',
      '/team': '팀 관리',
      '/funds': '자금 관리',
      '/settlements': '정산 관리',
      '/settings': '설정'
    };
    return pathMap[pathname] || '페이지';
  })();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={toggleSidebar}
          aria-label="메뉴 토글"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex h-9 w-9"
          onClick={toggleSidebar}
          aria-label={`사이드바 ${state === 'expanded' ? '접기' : '펼치기'}`}
        >
          {state === 'expanded' ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Notifications - Desktop only */}
        {notifications && notifications > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hidden lg:flex"
            aria-label={`알림 ${notifications}개`}
          >
            <Menu className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">
              {notifications > 99 ? "99+" : notifications}
            </span>
          </Button>
        )}
      </div>

      {/* Breadcrumbs - Desktop only */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-t bg-background/50 px-6 py-3 hidden lg:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
    </header>
  );
});

DesktopHeader.displayName = 'DesktopHeader';

function ResponsiveLayoutInner({
  children,
  breadcrumbs = [],
  showFAB = true,
  showBottomNav = true,
  className,
  title,
  subtitle,
  notifications = 0
}: ResponsiveLayoutProps) {
  const router = useRouter();
  const [quickInputType, setQuickInputType] = useState<QuickInputType>(null);
  const [isContactFeedModalOpen, setIsContactFeedModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 키보드 네비게이션 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키로 모달 닫기
      if (e.key === 'Escape') {
        setQuickInputType(null);
        setIsContactFeedModalOpen(false);
      }

      // Alt + N으로 빠른 입력 열기
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setQuickInputType('contact');
      }

      // Alt + F로 피드 입력 열기
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        setQuickInputType('feed');
      }

      // Alt + C로 계산기 열기
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        router.push('/calculator');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // 모달 열림 시 스크롤 잠금
  useEffect(() => {
    if (quickInputType || isContactFeedModalOpen) {
      mobile.lockScroll();
    } else {
      mobile.unlockScroll();
    }

    return () => mobile.unlockScroll();
  }, [quickInputType, isContactFeedModalOpen]);

  // Memoized event handlers for better performance
  const handleQuickInputSave = useCallback((data: any) => {
    console.log('Quick input saved:', data);
    mobile.hapticFeedback.medium();
    setQuickInputType(null);
  }, []);

  const handleContactSave = useCallback((data: any) => {
    console.log('Contact saved:', data);
    mobile.hapticFeedback.medium();
    setIsContactFeedModalOpen(false);
  }, []);

  const handleFeedSave = useCallback((data: any) => {
    console.log('Feed saved:', data);
    mobile.hapticFeedback.medium();
    setIsContactFeedModalOpen(false);
  }, []);

  const handleQuickInputClose = useCallback(() => {
    setQuickInputType(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsContactFeedModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      <div
        className="flex h-screen w-full lg:min-w-full lg:max-w-none max-w-[100vw]"
        style={{ width: isMobile ? '100%' : '100vw' }}
      >
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DesktopSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header (mobile only) */}
          <div className="lg:hidden">
            <MobileHeader
              title={title}
              subtitle={subtitle}
              notifications={notifications}
            />
          </div>

          {/* Desktop Header (desktop only) */}
          <div className="hidden lg:block">
            <DesktopHeader
              title={title}
              subtitle={subtitle}
              breadcrumbs={breadcrumbs}
              notifications={notifications}
            />
          </div>

          {/* Main Content */}
          <main
            id="main-content"
            className={cn(
              "flex-1 overflow-auto",
              "w-full max-w-none px-4 py-6 md:px-6 lg:px-8",
              showBottomNav && "pb-24 lg:pb-6", // 하단 네비게이션을 위한 여백 (모바일에서만)
              className
            )}
            role="main"
            aria-label="메인 콘텐츠"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation (mobile only) */}
      {showBottomNav && (
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      )}

      {/* Quick Logger FAB */}
      {showFAB && (
        <QuickLoggerFAB />
      )}

      {/* Quick Input Overlay */}
      {quickInputType && (
        <QuickInputOverlay
          type={quickInputType}
          isOpen={true}
          onClose={handleQuickInputClose}
          onSave={handleQuickInputSave}
        />
      )}

      {/* Detailed Contact/Feed Modal */}
      <ContactFeedModal
        isOpen={isContactFeedModalOpen}
        onClose={handleModalClose}
        onSaveContact={handleContactSave}
        onSaveFeed={handleFeedSave}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />

      {/* Screen Reader Announcements */}
      <div
        id="announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Keyboard Shortcuts Help (숨겨진 요소) */}
      <div className="sr-only">
        <h2>키보드 단축키</h2>
        <ul>
          <li>Ctrl/Cmd + B: 사이드바 토글</li>
          <li>Alt + N: 새 컨택 입력</li>
          <li>Alt + F: 피드백 입력</li>
          <li>Alt + C: 정산 계산기</li>
          <li>ESC: 모달 닫기</li>
          <li>Tab: 다음 요소로 이동</li>
          <li>Shift + Tab: 이전 요소로 이동</li>
        </ul>
      </div>

      {/* 개발 환경 모니터링 */}
      {/* <LazyPerformanceMonitor /> */}
      <LazyErrorMonitor />
    </div>
  );
}

export function ResponsiveLayout(props: ResponsiveLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <ResponsiveLayoutInner {...props} />
    </SidebarProvider>
  );
}