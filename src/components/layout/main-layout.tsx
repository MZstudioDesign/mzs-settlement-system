'use client'

import { useEffect, useState, useCallback, memo } from "react";
import { MobileHeader } from "@/components/navigation/mobile-header";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Breadcrumb, BreadcrumbItem } from "@/components/navigation/breadcrumb";
// import { QuickLoggerFAB } from "@/components/fab/quick-logger-fab";
import { QuickInputOverlay } from "@/components/overlays/quick-input-overlay";
import { ContactFeedModal } from "@/components/modals/contact-feed-modal";
import { cn, mobile, a11y } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { LazyPerformanceMonitor } from "@/components/common/lazy-components";

interface MainLayoutProps {
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

export function MainLayout({
  children,
  breadcrumbs = [],
  showFAB = true,
  showBottomNav = true,
  className,
  title,
  subtitle,
  notifications = 0
}: MainLayoutProps) {
  const router = useRouter();
  const [quickInputType, setQuickInputType] = useState<QuickInputType>(null);
  const [isContactFeedModalOpen, setIsContactFeedModalOpen] = useState(false);
  // Removed contactCount and feedCount - now handled by MZSQuickLoggerFAB
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  // FAB handlers removed - now handled by MZSQuickLoggerFAB internally

  // Memoized event handlers for better performance
  const handleQuickInputSave = useCallback((data: any) => {
    console.log('Quick input saved:', data);
    // 실제 구현에서는 API 호출 또는 상태 업데이트

    // 성공 피드백
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

      {/* Header */}
      <MobileHeader
        title={title}
        subtitle={subtitle}
        notifications={notifications}
      />

      {/* Breadcrumbs - Desktop에서만 표시 */}
      {breadcrumbs.length > 0 && !isMobile && (
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          "container mx-auto px-4 py-6",
          showBottomNav && "pb-24", // 하단 네비게이션을 위한 여백
          className
        )}
        role="main"
        aria-label="메인 콘텐츠"
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}

      {/* Quick Logger FAB - 임시 비활성화 */}
      {false && showFAB && (
        <div>FAB will be enabled later</div>
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
          <li>Alt + N: 새 컨택 입력</li>
          <li>Alt + F: 피드백 입력</li>
          <li>Alt + C: 정산 계산기</li>
          <li>ESC: 모달 닫기</li>
          <li>Tab: 다음 요소로 이동</li>
          <li>Shift + Tab: 이전 요소로 이동</li>
        </ul>
      </div>

      {/* 개발 환경 성능 모니터 */}
      <LazyPerformanceMonitor />
    </div>
  );
}