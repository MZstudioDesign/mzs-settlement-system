import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "KRW"): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// 접근성 관련 유틸리티
export const a11y = {
  // 스크린 리더 전용 텍스트
  srOnly: (text: string) => ({
    'aria-label': text,
    className: 'sr-only'
  }),

  // 키보드 네비게이션 지원
  keyboardNavigation: {
    onKeyDown: (callback: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    }
  },

  // 포커스 관리
  focus: {
    // 포커스 트랩용 요소 선택자
    focusableElements: [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', '),

    // 첫 번째/마지막 포커스 가능한 요소 찾기
    getFirstFocusable: (container: HTMLElement) =>
      container.querySelector(a11y.focus.focusableElements) as HTMLElement,

    getLastFocusable: (container: HTMLElement) => {
      const elements = container.querySelectorAll(a11y.focus.focusableElements);
      return elements[elements.length - 1] as HTMLElement;
    },

    // 포커스 트랩 구현
    trapFocus: (container: HTMLElement) => {
      const firstFocusable = a11y.focus.getFirstFocusable(container);
      const lastFocusable = a11y.focus.getLastFocusable(container);

      return (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };
    }
  },

  // 터치 타겟 크기 검증 (최소 44px)
  touchTarget: {
    minSize: 44,
    isValidSize: (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }
  },

  // ARIA 라벨 생성
  generateId: (prefix: string = 'element') =>
    `${prefix}-${Math.random().toString(36).substr(2, 9)}`
};

// 반응형 유틸리티
export const responsive = {
  // 뷰포트 크기 감지
  viewportSize: {
    isMobile: () => window.innerWidth < 768,
    isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: () => window.innerWidth >= 1024
  },

  // 터치 디바이스 감지
  isTouchDevice: () =>
    'ontouchstart' in window || navigator.maxTouchPoints > 0
};

// 성능 최적화 유틸리티
export const performance = {
  // 디바운스
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // 스로틀
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 모바일 UX 유틸리티
export const mobile = {
  // 스크롤 잠금
  lockScroll: () => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  },

  unlockScroll: () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  },

  // 햅틱 피드백 (지원되는 디바이스에서)
  hapticFeedback: {
    light: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    medium: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    },
    heavy: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
    }
  }
};

// 검증 유틸리티
export const validation = {
  // 이메일 검증
  isValidEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 한국 전화번호 검증
  isValidPhone: (phone: string) => {
    const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // 빈 값 검증
  isRequired: (value: any) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value) && value !== 0;
    return value != null;
  },

  // 문자 길이 검증
  hasMinLength: (value: string, min: number) => value.length >= min,
  hasMaxLength: (value: string, max: number) => value.length <= max,

  // 숫자 범위 검증
  isInRange: (value: number, min: number, max: number) =>
    value >= min && value <= max
};
