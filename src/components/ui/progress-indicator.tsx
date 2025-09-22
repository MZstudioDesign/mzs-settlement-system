'use client'

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from "lucide-react";

interface ProgressIndicatorProps {
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'paused';
  progress?: number; // 0-100
  showProgress?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

interface StepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    description?: string;
  }>;
  currentStep?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG = {
  planning: {
    label: '기획',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    badgeVariant: 'secondary' as const,
    progressColor: 'bg-gray-400'
  },
  in_progress: {
    label: '진행중',
    icon: PlayCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeVariant: 'default' as const,
    progressColor: 'bg-blue-500'
  },
  review: {
    label: '검토',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    badgeVariant: 'outline' as const,
    progressColor: 'bg-yellow-500'
  },
  completed: {
    label: '완료',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    badgeVariant: 'default' as const,
    progressColor: 'bg-green-500'
  },
  cancelled: {
    label: '취소',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    badgeVariant: 'destructive' as const,
    progressColor: 'bg-red-500'
  },
  paused: {
    label: '일시정지',
    icon: PauseCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badgeVariant: 'outline' as const,
    progressColor: 'bg-orange-500'
  }
};

const STEP_STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  in_progress: {
    icon: RotateCcw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
};

export function ProgressIndicator({
  status,
  progress = 0,
  showProgress = true,
  showIcon = true,
  size = 'md',
  variant = 'default',
  className
}: ProgressIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // 완료 상태일 때 진행률을 100으로 설정
  const displayProgress = status === 'completed' ? 100 :
                         status === 'cancelled' ? 0 :
                         progress;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        {showIcon && <Icon className={cn(iconSizes[size], config.color)} />}
        <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
          {config.label}
        </Badge>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showIcon && <Icon className={cn(iconSizes[size], config.color)} />}
            <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
              {config.label}
            </Badge>
          </div>
          {showProgress && (
            <span className={cn("font-mono text-xs", config.color)}>
              {displayProgress}%
            </span>
          )}
        </div>

        {showProgress && (
          <div className="space-y-1">
            <Progress
              value={displayProgress}
              className="h-2"
              // @ts-ignore - Progress 컴포넌트에 커스텀 색상 적용을 위한 임시 처리
              style={{
                '--progress-background': config.progressColor.replace('bg-', '')
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>진행률</span>
              <span>{displayProgress}% 완료</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showIcon && <Icon className={cn(iconSizes[size], config.color)} />}
      <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
        {config.label}
      </Badge>
      {showProgress && (
        <span className={cn("font-mono", sizeClasses[size], config.color)}>
          {displayProgress}%
        </span>
      )}
    </div>
  );
}

export function StepProgress({
  steps,
  currentStep,
  orientation = 'horizontal',
  size = 'md',
  className
}: StepProgressProps) {
  const isHorizontal = orientation === 'horizontal';

  const sizeClasses = {
    sm: { text: 'text-xs', icon: 'h-4 w-4', step: 'h-6 w-6' },
    md: { text: 'text-sm', icon: 'h-5 w-5', step: 'h-8 w-8' },
    lg: { text: 'text-base', icon: 'h-6 w-6', step: 'h-10 w-10' }
  };

  return (
    <div className={cn(
      "flex",
      isHorizontal ? "items-center space-x-4" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const config = STEP_STATUS_CONFIG[step.status];
        const Icon = config.icon;
        const isLast = index === steps.length - 1;
        const isCurrent = currentStep === step.id;

        return (
          <div key={step.id} className={cn(
            "flex",
            isHorizontal ? "items-center" : "items-start space-x-3"
          )}>
            {/* Step Circle */}
            <div className={cn(
              "flex items-center justify-center rounded-full border-2 transition-all",
              sizeClasses[size].step,
              config.bgColor,
              config.borderColor,
              isCurrent && "ring-2 ring-primary ring-offset-2"
            )}>
              <Icon className={cn(sizeClasses[size].icon, config.color)} />
            </div>

            {/* Step Content */}
            {!isHorizontal && (
              <div className="flex-1 space-y-1">
                <p className={cn(
                  "font-medium",
                  sizeClasses[size].text,
                  config.color
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            )}

            {/* Connector Line */}
            {!isLast && (
              <div className={cn(
                isHorizontal
                  ? "h-0.5 w-8 bg-muted"
                  : "w-0.5 h-8 bg-muted ml-3"
              )} />
            )}
          </div>
        );
      })}

      {/* Horizontal Labels */}
      {isHorizontal && (
        <div className="flex items-center space-x-4 mt-2">
          {steps.map((step, index) => {
            const config = STEP_STATUS_CONFIG[step.status];
            const isCurrent = currentStep === step.id;
            const isLast = index === steps.length - 1;

            return (
              <div key={`label-${step.id}`} className="flex items-center">
                <div className="text-center">
                  <p className={cn(
                    "font-medium",
                    sizeClasses[size].text,
                    config.color
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
                {!isLast && <div className="w-8" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 사용 예시를 위한 프리셋 컴포넌트들
export function ProjectProgressIndicator({
  status,
  progress
}: {
  status: ProgressIndicatorProps['status'];
  progress: number;
}) {
  return (
    <ProgressIndicator
      status={status}
      progress={progress}
      variant="detailed"
      showProgress={true}
      showIcon={true}
    />
  );
}

export function SettlementStepProgress({
  currentStep
}: {
  currentStep: string
}) {
  const steps = [
    {
      id: 'draft',
      label: '초안 작성',
      status: 'completed' as const,
      description: '정산 내역 계산'
    },
    {
      id: 'review',
      label: '검토',
      status: currentStep === 'review' ? 'in_progress' as const :
              currentStep === 'draft' ? 'pending' as const : 'completed' as const,
      description: '내용 확인 및 승인'
    },
    {
      id: 'approval',
      label: '승인',
      status: currentStep === 'approval' ? 'in_progress' as const :
              ['draft', 'review'].includes(currentStep) ? 'pending' as const : 'completed' as const,
      description: '최종 승인 처리'
    },
    {
      id: 'payment',
      label: '지급',
      status: currentStep === 'payment' ? 'in_progress' as const :
              currentStep === 'completed' ? 'completed' as const : 'pending' as const,
      description: '정산금 지급 완료'
    }
  ];

  return (
    <StepProgress
      steps={steps}
      currentStep={currentStep}
      orientation="horizontal"
      size="md"
    />
  );
}