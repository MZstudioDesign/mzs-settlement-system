'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Edit,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SettlementDetailCardProps {
  settlement: {
    id: string;
    projectName: string;
    clientName: string;
    totalAmount: number;
    netAmount: number;
    vatAmount: number;
    taxAmount: number;
    designerTotal: number;
    studioRevenue: number;
    status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    designers: Array<{
      id: string;
      name: string;
      amount: number;
      share: number;
      incentive: number;
    }>;
    category: string;
    tags?: string[];
  };
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
}

const STATUS_CONFIG = {
  draft: { label: '초안', variant: 'secondary' as const, color: 'text-gray-600' },
  pending: { label: '승인대기', variant: 'outline' as const, color: 'text-yellow-600' },
  approved: { label: '승인완료', variant: 'default' as const, color: 'text-green-600' },
  paid: { label: '지급완료', variant: 'default' as const, color: 'text-blue-600' },
  cancelled: { label: '취소됨', variant: 'destructive' as const, color: 'text-red-600' },
};

const CATEGORY_LABELS = {
  'brand-identity': '브랜드 아이덴티티',
  'web-design': '웹 디자인',
  'app-design': '앱 디자인',
  'print-design': '인쇄 디자인',
  'package-design': '패키지 디자인',
  'marketing-design': '마케팅 디자인',
  'illustration': '일러스트레이션',
  'other': '기타'
};

export function SettlementDetailCard({
  settlement,
  onEdit,
  onView,
  onDownload,
  onApprove,
  onReject,
  className
}: SettlementDetailCardProps) {
  const statusConfig = STATUS_CONFIG[settlement.status];
  const categoryLabel = CATEGORY_LABELS[settlement.category as keyof typeof CATEGORY_LABELS] || settlement.category;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const designerSharePercentage = ((settlement.designerTotal / settlement.netAmount) * 100).toFixed(1);
  const studioSharePercentage = ((settlement.studioRevenue / settlement.netAmount) * 100).toFixed(1);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-lg leading-6 truncate">
              {settlement.projectName}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <span>{settlement.clientName}</span>
              <span>•</span>
              <span>{categoryLabel}</span>
            </CardDescription>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(settlement.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    상세보기
                  </DropdownMenuItem>
                )}
                {onEdit && settlement.status === 'draft' && (
                  <DropdownMenuItem onClick={() => onEdit(settlement.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    수정하기
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={() => onDownload(settlement.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    다운로드
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 태그 */}
        {settlement.tags && settlement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {settlement.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 금액 정보 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">총 프로젝트 금액</p>
              <p className="font-mono text-lg font-semibold">
                {formatCurrency(settlement.totalAmount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">실제 입금액</p>
              <p className="font-mono text-lg font-semibold text-primary">
                {formatCurrency(settlement.netAmount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">부가세 (10%)</span>
              <span className="font-mono text-red-600">
                -{formatCurrency(settlement.vatAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">원천징수 (3.3%)</span>
              <span className="font-mono text-red-600">
                -{formatCurrency(settlement.taxAmount)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 분배 정보 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">분배 내역</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                디자이너 총액 ({designerSharePercentage}%)
              </p>
              <p className="font-mono text-sm font-semibold text-green-600">
                {formatCurrency(settlement.designerTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                스튜디오 수익 ({studioSharePercentage}%)
              </p>
              <p className="font-mono text-sm font-semibold text-blue-600">
                {formatCurrency(settlement.studioRevenue)}
              </p>
            </div>
          </div>

          {/* 분배율 시각화 */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${designerSharePercentage}%` }}
                title={`디자이너: ${designerSharePercentage}%`}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${studioSharePercentage}%` }}
                title={`스튜디오: ${studioSharePercentage}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>디자이너</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>스튜디오</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 디자이너 정보 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">참여 디자이너</span>
            <Badge variant="outline" className="text-xs">
              {settlement.designers.length}명
            </Badge>
          </div>

          <div className="space-y-2">
            {settlement.designers.map((designer) => (
              <div key={designer.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="font-medium truncate">{designer.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {designer.share.toFixed(1)}%
                  </Badge>
                  {designer.incentive > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      +{designer.incentive.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-xs">
                  {formatCurrency(designer.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 메타 정보 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>생성: {formatDate(settlement.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calculator className="h-3 w-3" />
              <span>수정: {formatDate(settlement.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        {settlement.status === 'pending' && (onApprove || onReject) && (
          <div className="flex space-x-2 pt-2">
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(settlement.id)}
                className="flex-1"
              >
                승인
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(settlement.id)}
                className="flex-1"
              >
                반려
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}