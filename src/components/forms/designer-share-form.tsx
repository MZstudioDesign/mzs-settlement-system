'use client'

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Users, AlertTriangle, Save, RotateCcw, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Constants
const DEFAULT_BASE_SHARE = 40; // 디자이너 기본 지분 40%
const MAX_INCENTIVE = 20; // 최대 인센티브 20%

// Zod Schema
const designerShareSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseShare: z.number().min(0).max(DEFAULT_BASE_SHARE),
  incentive: z.number().min(0).max(MAX_INCENTIVE),
  contribution: z.number().min(0).max(100),
  amount: z.number().min(0),
});

const designerShareFormSchema = z.object({
  shares: z.array(designerShareSchema),
  projectAmount: z.number().min(0),
  netAmount: z.number().min(0),
}).refine((data) => {
  // 총 기본 지분이 정확히 40%인지 검증
  const totalBaseShare = data.shares.reduce((sum, share) => sum + share.baseShare, 0);
  return Math.abs(totalBaseShare - DEFAULT_BASE_SHARE) < 0.1;
}, {
  message: `총 기본 지분이 ${DEFAULT_BASE_SHARE}%와 일치해야 합니다`,
  path: ['shares']
}).refine((data) => {
  // 총 인센티브가 20% 이하인지 검증
  const totalIncentive = data.shares.reduce((sum, share) => sum + share.incentive, 0);
  return totalIncentive <= MAX_INCENTIVE;
}, {
  message: `총 인센티브가 ${MAX_INCENTIVE}%를 초과할 수 없습니다`,
  path: ['shares']
}).refine((data) => {
  // 총 기여도가 100%인지 검증
  const totalContribution = data.shares.reduce((sum, share) => sum + share.contribution, 0);
  return Math.abs(totalContribution - 100) < 0.1;
}, {
  message: '총 기여도가 100%와 일치해야 합니다',
  path: ['shares']
}).refine((data) => {
  // 개별 인센티브가 0-20% 범위인지 검증
  return data.shares.every(share => share.incentive >= 0 && share.incentive <= MAX_INCENTIVE);
}, {
  message: `인센티브는 0-${MAX_INCENTIVE}% 사이의 값이어야 합니다`,
  path: ['shares']
});

type DesignerShareFormData = z.infer<typeof designerShareFormSchema>;
type DesignerShare = z.infer<typeof designerShareSchema>;

interface DesignerShareFormProps {
  projectAmount: number;
  designers: Array<{
    id: string;
    name: string;
  }>;
  initialShares?: DesignerShare[];
  onSave?: (shares: DesignerShare[]) => void;
  onCancel?: () => void;
}

export function DesignerShareForm({
  projectAmount,
  designers,
  initialShares,
  onSave,
  onCancel
}: DesignerShareFormProps) {
  // 초기 데이터 생성
  const getInitialData = (): DesignerShareFormData => {
    let initialSharesData: DesignerShare[];

    if (initialShares) {
      initialSharesData = initialShares;
    } else {
      // 기본값: 디자이너 수로 균등 분배
      const baseSharePerDesigner = designers.length > 0 ? DEFAULT_BASE_SHARE / designers.length : 0;

      initialSharesData = designers.map(designer => ({
        id: designer.id,
        name: designer.name,
        baseShare: baseSharePerDesigner,
        incentive: 0,
        contribution: 100 / designers.length, // 기여도 균등 분배
        amount: 0
      }));
    }

    // 세후 실입금액 계산
    const vatAmount = Math.round(projectAmount * 0.1);
    const amountExcludingVat = projectAmount - vatAmount;
    const taxAmount = Math.round(amountExcludingVat * 0.033);
    const calculatedNetAmount = amountExcludingVat - taxAmount;

    return {
      shares: initialSharesData,
      projectAmount,
      netAmount: calculatedNetAmount
    };
  };

  // React Hook Form 설정
  const form = useForm<DesignerShareFormData>({
    resolver: zodResolver(designerShareFormSchema),
    defaultValues: getInitialData(),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "shares"
  });

  // 실시간 값 감시
  const watchedShares = form.watch("shares");
  const watchedNetAmount = form.watch("netAmount");

  // 배분 금액 실시간 계산
  useEffect(() => {
    const updatedShares = watchedShares.map(share => {
      // 기본 지분 금액
      const baseAmount = Math.round(watchedNetAmount * (share.baseShare / 100));
      // 인센티브 금액
      const incentiveAmount = Math.round(watchedNetAmount * (share.incentive / 100));

      return {
        ...share,
        amount: baseAmount + incentiveAmount
      };
    });

    // amount 필드만 업데이트 (무한 루프 방지)
    updatedShares.forEach((share, index) => {
      if (form.getValues(`shares.${index}.amount`) !== share.amount) {
        form.setValue(`shares.${index}.amount`, share.amount);
      }
    });
  }, [watchedShares, watchedNetAmount, form]);

  // 유틸리티 함수들
  const updateBaseShare = (index: number, newShare: number) => {
    const currentShares = form.getValues("shares");
    const otherShares = currentShares.filter((_, idx) => idx !== index);
    const totalOtherShares = otherShares.reduce((sum, s) => sum + s.baseShare, 0);

    // 전체 기본 지분이 40%를 초과하지 않도록 조정
    if (totalOtherShares + newShare > DEFAULT_BASE_SHARE) {
      const adjustmentRatio = (DEFAULT_BASE_SHARE - newShare) / totalOtherShares;

      currentShares.forEach((share, idx) => {
        if (idx === index) {
          form.setValue(`shares.${idx}.baseShare`, newShare);
        } else {
          const adjustedShare = Math.max(0, share.baseShare * adjustmentRatio);
          form.setValue(`shares.${idx}.baseShare`, adjustedShare);
        }
      });
    } else {
      form.setValue(`shares.${index}.baseShare`, newShare);
    }
  };

  const resetToEqual = () => {
    const equalBaseShare = DEFAULT_BASE_SHARE / designers.length;
    const equalContribution = 100 / designers.length;

    watchedShares.forEach((_, index) => {
      form.setValue(`shares.${index}.baseShare`, equalBaseShare);
      form.setValue(`shares.${index}.incentive`, 0);
      form.setValue(`shares.${index}.contribution`, equalContribution);
    });
  };

  // 계산된 값들
  const totalBaseShare = watchedShares.reduce((sum, share) => sum + share.baseShare, 0);
  const totalIncentive = watchedShares.reduce((sum, share) => sum + share.incentive, 0);
  const totalContribution = watchedShares.reduce((sum, share) => sum + share.contribution, 0);
  const totalAmount = watchedShares.reduce((sum, share) => sum + share.amount, 0);
  const studioRevenue = watchedNetAmount - totalAmount;

  const isValidDistribution =
    Math.abs(totalBaseShare - DEFAULT_BASE_SHARE) < 0.1 &&
    totalIncentive <= MAX_INCENTIVE &&
    Math.abs(totalContribution - 100) < 0.1;

  const handleSave = () => {
    if (isValidDistribution && form.formState.isValid) {
      onSave?.(watchedShares);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* 프로젝트 정보 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>디자이너 지분 설정</span>
            </CardTitle>
            <CardDescription>
              프로젝트 참여 디자이너별 지분과 인센티브를 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">총 프로젝트 금액</span>
                <p className="font-mono text-lg">{formatCurrency(projectAmount)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">실제 입금액</span>
                <p className="font-mono text-lg text-primary">{formatCurrency(watchedNetAmount)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">참여 디자이너</span>
                <p className="text-lg">{designers.length}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 디자이너별 지분 설정 */}
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle className="text-lg">{watchedShares[index]?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 기본 지분 */}
              <FormField
                control={form.control}
                name={`shares.${index}.baseShare`}
                render={({ field: baseShareField }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>기본 지분</FormLabel>
                      <Badge variant="outline">
                        {watchedShares[index]?.baseShare?.toFixed(1)}%
                      </Badge>
                    </div>
                    <FormControl>
                      <Slider
                        value={[baseShareField.value || 0]}
                        onValueChange={([value]) => updateBaseShare(index, value)}
                        max={DEFAULT_BASE_SHARE}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>{DEFAULT_BASE_SHARE}%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 인센티브 */}
              <FormField
                control={form.control}
                name={`shares.${index}.incentive`}
                render={({ field: incentiveField }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>인센티브</FormLabel>
                      <Badge variant="secondary">
                        {watchedShares[index]?.incentive?.toFixed(1)}%
                      </Badge>
                    </div>
                    <FormControl>
                      <Slider
                        value={[incentiveField.value || 0]}
                        onValueChange={([value]) => form.setValue(`shares.${index}.incentive`, value)}
                        max={MAX_INCENTIVE}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>{MAX_INCENTIVE}%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 기여도 */}
              <FormField
                control={form.control}
                name={`shares.${index}.contribution`}
                render={({ field: contributionField }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>프로젝트 기여도</FormLabel>
                      <Badge variant="outline">
                        {watchedShares[index]?.contribution?.toFixed(1)}%
                      </Badge>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={contributionField.value || 0}
                        onChange={(e) => contributionField.onChange(Number(e.target.value))}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* 계산 결과 */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>기본 지분 금액</span>
                  <span className="font-mono">
                    {formatCurrency(Math.round(watchedNetAmount * ((watchedShares[index]?.baseShare || 0) / 100)))}
                  </span>
                </div>
                {(watchedShares[index]?.incentive || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>인센티브 금액</span>
                    <span className="font-mono">
                      +{formatCurrency(Math.round(watchedNetAmount * ((watchedShares[index]?.incentive || 0) / 100)))}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>총 수령액</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(watchedShares[index]?.amount || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* 전체 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>배분 요약</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">총 기본 지분</span>
              <p className="font-mono text-lg">
                {totalBaseShare.toFixed(1)}%
                <span className="text-xs ml-1">
                  /{DEFAULT_BASE_SHARE}%
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">총 인센티브</span>
              <p className="font-mono text-lg">
                {totalIncentive.toFixed(1)}%
                <span className="text-xs ml-1">
                  /{MAX_INCENTIVE}%
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">디자이너 총액</span>
              <p className="font-mono text-lg text-green-600">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">스튜디오 수익</span>
              <p className="font-mono text-lg text-blue-600">{formatCurrency(studioRevenue)}</p>
            </div>
          </div>

          {/* 폼 검증 오류 표시 */}
          {form.formState.errors.shares && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {form.formState.errors.shares.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 유효성 검사 알림 */}
          {!isValidDistribution && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-1 text-sm">
                  {Math.abs(totalBaseShare - DEFAULT_BASE_SHARE) >= 0.1 && (
                    <li>• 총 기본 지분이 {DEFAULT_BASE_SHARE}%와 일치하지 않습니다.</li>
                  )}
                  {totalIncentive > MAX_INCENTIVE && (
                    <li>• 총 인센티브가 최대 {MAX_INCENTIVE}%를 초과했습니다.</li>
                  )}
                  {Math.abs(totalContribution - 100) >= 0.1 && (
                    <li>• 총 기여도가 100%와 일치하지 않습니다.</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 분배율 시각화 */}
          <div className="space-y-2">
            <Label>배분 비율</Label>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              {watchedShares.map((share, index) => (
                <div
                  key={share.id}
                  className="bg-primary transition-all"
                  style={{
                    width: `${(share.amount / watchedNetAmount) * 100}%`,
                    backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 50%)`
                  }}
                  title={`${share.name}: ${((share.amount / watchedNetAmount) * 100).toFixed(1)}%`}
                />
              ))}
              <div
                className="bg-blue-500"
                style={{ width: `${(studioRevenue / watchedNetAmount) * 100}%` }}
                title={`스튜디오: ${((studioRevenue / watchedNetAmount) * 100).toFixed(1)}%`}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {watchedShares.map((share, index) => (
                <div key={share.id} className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 50%)` }}
                  />
                  <span>{share.name}</span>
                </div>
              ))}
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>스튜디오</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* 액션 버튼 */}
        <div className="flex space-x-2 sticky bottom-0 bg-background py-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isValidDistribution || !form.formState.isValid}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            지분 설정 저장
          </Button>
          <Button variant="outline" onClick={resetToEqual}>
            <RotateCcw className="mr-2 h-4 w-4" />
            균등 분배
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}