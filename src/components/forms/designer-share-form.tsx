'use client'

import { useState, useEffect } from "react";
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

interface DesignerShare {
  id: string;
  name: string;
  baseShare: number; // 기본 지분 (%)
  incentive: number; // 인센티브 (%)
  contribution: number; // 기여도 (%)
  amount: number; // 실제 배분 금액
}

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

const DEFAULT_BASE_SHARE = 40; // 디자이너 기본 지분 40%
const MAX_INCENTIVE = 20; // 최대 인센티브 20%

export function DesignerShareForm({
  projectAmount,
  designers,
  initialShares,
  onSave,
  onCancel
}: DesignerShareFormProps) {
  const [shares, setShares] = useState<DesignerShare[]>(() => {
    if (initialShares) return initialShares;

    // 기본값: 디자이너 수로 균등 분배
    const baseSharePerDesigner = designers.length > 0 ? DEFAULT_BASE_SHARE / designers.length : 0;

    return designers.map(designer => ({
      id: designer.id,
      name: designer.name,
      baseShare: baseSharePerDesigner,
      incentive: 0,
      contribution: 100 / designers.length, // 기여도 균등 분배
      amount: 0
    }));
  });

  const [netAmount, setNetAmount] = useState(0);

  // 세후 실입금액 계산
  useEffect(() => {
    // 부가세 10% 제외
    const vatAmount = Math.round(projectAmount * 0.1);
    const amountExcludingVat = projectAmount - vatAmount;

    // 원천징수 3.3% 제외
    const taxAmount = Math.round(amountExcludingVat * 0.033);
    const calculatedNetAmount = amountExcludingVat - taxAmount;

    setNetAmount(calculatedNetAmount);
  }, [projectAmount]);

  // 배분 금액 계산
  useEffect(() => {
    const updatedShares = shares.map(share => {
      // 기본 지분 금액
      const baseAmount = Math.round(netAmount * (share.baseShare / 100));

      // 인센티브 금액
      const incentiveAmount = Math.round(netAmount * (share.incentive / 100));

      return {
        ...share,
        amount: baseAmount + incentiveAmount
      };
    });

    setShares(updatedShares);
  }, [netAmount, shares.map(s => `${s.baseShare}-${s.incentive}`).join(',')]);

  const updateShare = (id: string, field: keyof DesignerShare, value: number) => {
    setShares(prev => prev.map(share =>
      share.id === id ? { ...share, [field]: value } : share
    ));
  };

  const updateBaseShare = (id: string, newShare: number) => {
    const otherShares = shares.filter(s => s.id !== id);
    const totalOtherShares = otherShares.reduce((sum, s) => sum + s.baseShare, 0);

    // 전체 기본 지분이 40%를 초과하지 않도록 조정
    if (totalOtherShares + newShare > DEFAULT_BASE_SHARE) {
      const adjustmentRatio = (DEFAULT_BASE_SHARE - newShare) / totalOtherShares;
      setShares(prev => prev.map(share =>
        share.id === id
          ? { ...share, baseShare: newShare }
          : { ...share, baseShare: Math.max(0, share.baseShare * adjustmentRatio) }
      ));
    } else {
      updateShare(id, 'baseShare', newShare);
    }
  };

  const resetToEqual = () => {
    const equalBaseShare = DEFAULT_BASE_SHARE / designers.length;
    const equalContribution = 100 / designers.length;

    setShares(prev => prev.map(share => ({
      ...share,
      baseShare: equalBaseShare,
      incentive: 0,
      contribution: equalContribution
    })));
  };

  const totalBaseShare = shares.reduce((sum, share) => sum + share.baseShare, 0);
  const totalIncentive = shares.reduce((sum, share) => sum + share.incentive, 0);
  const totalContribution = shares.reduce((sum, share) => sum + share.contribution, 0);
  const totalAmount = shares.reduce((sum, share) => sum + share.amount, 0);
  const studioRevenue = netAmount - totalAmount;

  const isValidDistribution =
    Math.abs(totalBaseShare - DEFAULT_BASE_SHARE) < 0.1 &&
    totalIncentive <= MAX_INCENTIVE &&
    Math.abs(totalContribution - 100) < 0.1;

  const handleSave = () => {
    if (isValidDistribution) {
      onSave?.(shares);
    }
  };

  return (
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
              <p className="font-mono text-lg text-primary">{formatCurrency(netAmount)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">참여 디자이너</span>
              <p className="text-lg">{designers.length}명</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 디자이너별 지분 설정 */}
      {shares.map((share, index) => (
        <Card key={share.id}>
          <CardHeader>
            <CardTitle className="text-lg">{share.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 지분 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>기본 지분</Label>
                <Badge variant="outline">
                  {share.baseShare.toFixed(1)}%
                </Badge>
              </div>
              <Slider
                value={[share.baseShare]}
                onValueChange={([value]) => updateBaseShare(share.id, value)}
                max={DEFAULT_BASE_SHARE}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{DEFAULT_BASE_SHARE}%</span>
              </div>
            </div>

            {/* 인센티브 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>인센티브</Label>
                <Badge variant="secondary">
                  {share.incentive.toFixed(1)}%
                </Badge>
              </div>
              <Slider
                value={[share.incentive]}
                onValueChange={([value]) => updateShare(share.id, 'incentive', value)}
                max={MAX_INCENTIVE}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{MAX_INCENTIVE}%</span>
              </div>
            </div>

            {/* 기여도 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>프로젝트 기여도</Label>
                <Badge variant="outline">
                  {share.contribution.toFixed(1)}%
                </Badge>
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={share.contribution}
                onChange={(e) => updateShare(share.id, 'contribution', Number(e.target.value))}
                className="text-center"
              />
            </div>

            <Separator />

            {/* 계산 결과 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>기본 지분 금액</span>
                <span className="font-mono">{formatCurrency(Math.round(netAmount * (share.baseShare / 100)))}</span>
              </div>
              {share.incentive > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>인센티브 금액</span>
                  <span className="font-mono">+{formatCurrency(Math.round(netAmount * (share.incentive / 100)))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>총 수령액</span>
                <span className="font-mono text-primary">{formatCurrency(share.amount)}</span>
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
              {shares.map((share, index) => (
                <div
                  key={share.id}
                  className="bg-primary transition-all"
                  style={{
                    width: `${(share.amount / netAmount) * 100}%`,
                    backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 50%)`
                  }}
                  title={`${share.name}: ${((share.amount / netAmount) * 100).toFixed(1)}%`}
                />
              ))}
              <div
                className="bg-blue-500"
                style={{ width: `${(studioRevenue / netAmount) * 100}%` }}
                title={`스튜디오: ${((studioRevenue / netAmount) * 100).toFixed(1)}%`}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {shares.map((share, index) => (
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
          disabled={!isValidDistribution}
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
  );
}