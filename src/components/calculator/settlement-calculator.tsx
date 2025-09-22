'use client'

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Save, RotateCcw, Info } from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCurrency } from "@/lib/currency";

interface SettlementResult {
  totalAmount: number;
  vatAmount: number;
  taxAmount: number;
  netAmount: number;
  designerShare: number;
  designerIncentive: number;
  designerTotal: number;
  studioRevenue: number;
}

interface SettlementCalculatorProps {
  onSave?: (result: SettlementResult & { projectName: string }) => void;
  initialValues?: {
    totalAmount?: number;
    incentiveRate?: number;
    projectName?: string;
  };
}

export function SettlementCalculator({
  onSave,
  initialValues = {}
}: SettlementCalculatorProps) {
  const [totalAmount, setTotalAmount] = useState(initialValues.totalAmount || 0);
  const [incentiveRate, setIncentiveRate] = useState(initialValues.incentiveRate || 0);
  const [projectName, setProjectName] = useState(initialValues.projectName || "");
  const [result, setResult] = useState<SettlementResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 정산 계산 로직
  const calculateSettlement = useCallback((amount: number, incentive: number): SettlementResult => {
    // 부가세 10% 계산
    const vatAmount = Math.round(amount * 0.1);
    const amountExcludingVat = amount - vatAmount;

    // 원천징수 3.3% 계산 (부가세 제외 금액 기준)
    const taxAmount = Math.round(amountExcludingVat * 0.033);

    // 실제 입금액
    const netAmount = amountExcludingVat - taxAmount;

    // 디자이너 기본 지분 40%
    const designerShare = Math.round(netAmount * 0.4);

    // 인센티브 계산 (실입금액 기준)
    const designerIncentive = Math.round(netAmount * (incentive / 100));

    // 디자이너 총 수령액
    const designerTotal = designerShare + designerIncentive;

    // 스튜디오 수익
    const studioRevenue = netAmount - designerTotal;

    return {
      totalAmount: amount,
      vatAmount,
      taxAmount,
      netAmount,
      designerShare,
      designerIncentive,
      designerTotal,
      studioRevenue
    };
  }, []);

  // 실시간 계산
  useEffect(() => {
    if (totalAmount > 0) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        const newResult = calculateSettlement(totalAmount, incentiveRate);
        setResult(newResult);
        setIsCalculating(false);
      }, 300); // 디바운싱

      return () => clearTimeout(timer);
    } else {
      setResult(null);
      setIsCalculating(false);
    }
  }, [totalAmount, incentiveRate, calculateSettlement]);

  const handleSave = () => {
    if (result && projectName.trim()) {
      onSave?.({
        ...result,
        projectName: projectName.trim()
      });
    }
  };

  const handleReset = () => {
    setTotalAmount(0);
    setIncentiveRate(0);
    setProjectName("");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>정산 계산기</span>
          </CardTitle>
          <CardDescription>
            프로젝트 정보를 입력하면 실시간으로 정산 내역을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로젝트명 */}
          <div className="space-y-2">
            <label
              htmlFor="project-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              프로젝트명
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: 브랜드 아이덴티티 디자인"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* 총 프로젝트 금액 */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              총 프로젝트 금액 (부가세 포함)
            </label>
            <MoneyInput
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="0"
              className="text-lg font-mono"
            />
          </div>

          {/* 인센티브율 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                인센티브율
              </label>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>0~20% 범위</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={incentiveRate}
                onChange={(e) => setIncentiveRate(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center space-x-1 min-w-0">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={incentiveRate}
                  onChange={(e) => setIncentiveRate(Number(e.target.value))}
                  className="w-16 h-8 text-center text-sm border border-input rounded-md"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!result || !projectName.trim()}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!totalAmount && !projectName}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 섹션 */}
      {(result || isCalculating) && (
        <Card>
          <CardHeader>
            <CardTitle>정산 결과</CardTitle>
            <CardDescription>
              {isCalculating ? "계산 중..." : "아래는 계산된 정산 내역입니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : result && (
              <div className="space-y-4">
                {/* 세전 계산 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">세금 계산</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>총 금액</span>
                      <span className="font-mono">{formatCurrency(result.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>부가세 (10%)</span>
                      <span className="font-mono">-{formatCurrency(result.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>원천징수 (3.3%)</span>
                      <span className="font-mono">-{formatCurrency(result.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium col-span-2 pt-2 border-t">
                      <span>실제 입금액</span>
                      <span className="font-mono text-primary">{formatCurrency(result.netAmount)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 분배 계산 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">분배 내역</h4>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>디자이너 기본 지분 (40%)</span>
                      <span className="font-mono">{formatCurrency(result.designerShare)}</span>
                    </div>
                    {result.designerIncentive > 0 && (
                      <div className="flex justify-between">
                        <span>디자이너 인센티브 ({incentiveRate}%)</span>
                        <span className="font-mono text-green-600">+{formatCurrency(result.designerIncentive)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>디자이너 총 수령액</span>
                      <span className="font-mono text-green-600">{formatCurrency(result.designerTotal)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>스튜디오 수익</span>
                      <span className="font-mono text-blue-600">{formatCurrency(result.studioRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* 분배율 표시 */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        디자이너: {((result.designerTotal / result.netAmount) * 100).toFixed(1)}%
                      </Badge>
                      <Badge variant="outline">
                        스튜디오: {((result.studioRevenue / result.netAmount) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}