'use client'

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Save, RotateCcw, Info, Users, Plus, Minus } from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import {
  formatCurrency,
  formatPercentage,
  formatTaxBreakdown,
  formatSettlementSummary,
  safeParseCurrency
} from "@/lib/currency";
import {
  calculateProjectSettlement,
  validateDesignerPercentages,
  validateBonusPercentage,
  validateProjectAmounts,
  previewSettlementCalculation,
  SETTLEMENT_RULES
} from "@/lib/settlement-calculations";
import type { DesignerAllocation } from "@/types/database";

// Updated interfaces for new calculation engine
interface DesignerFormData {
  id: string;
  name: string;
  percent: number;
  bonus_pct: number;
}

interface SettlementResult {
  grossAmount: number;
  netAmount: number;
  baseAmount: number;
  totalFees: number;
  totalDesignerPayout: number;
  companyProfit: number;
  designers: {
    id: string;
    name: string;
    percent: number;
    bonus_pct: number;
    designerAmount: number;
    bonusAmount: number;
    beforeWithholding: number;
    withholdingTax: number;
    afterWithholding: number;
  }[];
  fees: {
    adFee: number;
    programFee: number;
    channelFee: number;
  };
}

interface SettlementCalculatorProps {
  onSave?: (result: SettlementResult & { projectName: string }) => void;
  initialValues?: {
    grossAmount?: number;
    discountNet?: number;
    designers?: DesignerFormData[];
    channelFeeRate?: number;
    projectName?: string;
  };
}

export function SettlementCalculator({
  onSave,
  initialValues = {}
}: SettlementCalculatorProps) {
  // State management
  const [grossAmount, setGrossAmount] = useState(initialValues.grossAmount || 0);
  const [discountNet, setDiscountNet] = useState(initialValues.discountNet || 0);
  const [channelFeeRate, setChannelFeeRate] = useState(initialValues.channelFeeRate || 0);
  const [projectName, setProjectName] = useState(initialValues.projectName || "");
  const [designers, setDesigners] = useState<DesignerFormData[]>(
    initialValues.designers || [
      { id: '1', name: '디자이너 1', percent: 100, bonus_pct: 0 }
    ]
  );

  const [result, setResult] = useState<SettlementResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Add designer
  const addDesigner = () => {
    const newId = (designers.length + 1).toString();
    setDesigners([
      ...designers,
      { id: newId, name: `디자이너 ${newId}`, percent: 0, bonus_pct: 0 }
    ]);
  };

  // Remove designer
  const removeDesigner = (id: string) => {
    if (designers.length > 1) {
      setDesigners(designers.filter(d => d.id !== id));
    }
  };

  // Update designer
  const updateDesigner = (id: string, field: keyof DesignerFormData, value: string | number) => {
    setDesigners(designers.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Validation
  const validateInputs = useCallback(() => {
    const errors: string[] = [];

    // Validate amounts
    const amountValidation = validateProjectAmounts(grossAmount, discountNet);
    if (!amountValidation.valid) {
      errors.push(...amountValidation.errors);
    }

    // Validate designers
    const designerAllocations: DesignerAllocation[] = designers.map(d => ({
      member_id: d.id,
      percent: d.percent,
      bonus_pct: d.bonus_pct,
    }));

    const designerValidation = validateDesignerPercentages(designerAllocations);
    if (!designerValidation.valid) {
      errors.push(...designerValidation.errors);
    }

    // Validate individual bonus percentages
    designers.forEach((designer, index) => {
      const bonusValidation = validateBonusPercentage(designer.bonus_pct);
      if (!bonusValidation.valid) {
        errors.push(`${designer.name}: ${bonusValidation.error}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [grossAmount, discountNet, designers]);

  // Calculate settlement
  const calculateSettlement = useCallback(() => {
    if (!validateInputs() || grossAmount <= 0) {
      return null;
    }

    const designerAllocations: DesignerAllocation[] = designers.map(d => ({
      member_id: d.id,
      percent: d.percent,
      bonus_pct: d.bonus_pct,
    }));

    const calculation = calculateProjectSettlement(
      grossAmount,
      discountNet,
      designerAllocations,
      channelFeeRate / 100 // Convert percentage to decimal
    );

    const result: SettlementResult = {
      grossAmount,
      netAmount: calculation.projectCalculation.netB,
      baseAmount: calculation.projectCalculation.base,
      totalFees: calculation.projectCalculation.totalFees,
      totalDesignerPayout: calculation.summary.totalDesignerAllocation,
      companyProfit: calculation.summary.totalCompanyAllocation,
      designers: calculation.designerCalculations.map(dc => {
        const designer = designers.find(d => d.id === dc.member_id)!;
        return {
          id: dc.member_id,
          name: designer.name,
          percent: dc.percent,
          bonus_pct: dc.bonus_pct,
          designerAmount: dc.calculation.designerAmount,
          bonusAmount: dc.calculation.bonusAmount,
          beforeWithholding: dc.calculation.beforeWithholding,
          withholdingTax: dc.calculation.withholdingTax,
          afterWithholding: dc.calculation.afterWithholding,
        };
      }),
      fees: {
        adFee: calculation.projectCalculation.fees.adFee,
        programFee: calculation.projectCalculation.fees.programFee,
        channelFee: calculation.projectCalculation.fees.channelFee,
      },
    };

    return result;
  }, [grossAmount, discountNet, channelFeeRate, designers, validateInputs]);

  // Real-time calculation with debouncing
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const newResult = calculateSettlement();
      setResult(newResult);
      setIsCalculating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [calculateSettlement]);

  // Auto-adjust percentages to sum to 100%
  const autoAdjustPercentages = () => {
    const totalPercent = designers.reduce((sum, d) => sum + d.percent, 0);
    if (totalPercent !== 100 && designers.length > 0) {
      const adjustment = 100 / totalPercent;
      setDesigners(designers.map(d => ({
        ...d,
        percent: Math.round(d.percent * adjustment * 10) / 10 // Round to 1 decimal
      })));
    }
  };

  const handleSave = () => {
    if (result && projectName.trim() && validationErrors.length === 0) {
      onSave?.({
        ...result,
        projectName: projectName.trim()
      });
    }
  };

  const handleReset = () => {
    setGrossAmount(0);
    setDiscountNet(0);
    setChannelFeeRate(0);
    setProjectName("");
    setDesigners([{ id: '1', name: '디자이너 1', percent: 100, bonus_pct: 0 }]);
    setResult(null);
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>MZS 정산 계산기</span>
          </CardTitle>
          <CardDescription>
            프로젝트 정보와 디자이너 배분을 입력하면 실시간으로 정확한 정산 내역을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">입력 오류</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 총 프로젝트 금액 */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                총 프로젝트 금액 (부가세 포함 T)
              </label>
              <MoneyInput
                value={grossAmount}
                onChange={setGrossAmount}
                placeholder="0"
                className="text-lg font-mono"
              />
              <div className="text-xs text-muted-foreground">
                순금액 B: {grossAmount > 0 ? formatCurrency(Math.round(grossAmount / 1.1)) : '₩0'}
              </div>
            </div>

            {/* 할인 금액 */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                할인 금액 (순금액 기준)
              </label>
              <MoneyInput
                value={discountNet}
                onChange={setDiscountNet}
                placeholder="0"
                className="font-mono"
              />
            </div>
          </div>

          {/* 채널 수수료율 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                채널 수수료율
              </label>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>크몽 21%, 계좌입금 0%</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={channelFeeRate}
                onChange={(e) => setChannelFeeRate(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center space-x-1 min-w-0">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={channelFeeRate}
                  onChange={(e) => setChannelFeeRate(Number(e.target.value))}
                  className="w-16 h-8 text-center text-sm border border-input rounded-md"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>

          {/* 디자이너 배분 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <label className="text-sm font-medium leading-none">
                  디자이너 배분
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  designers.reduce((sum, d) => sum + d.percent, 0) === 100
                    ? "default"
                    : "destructive"
                }>
                  총합: {designers.reduce((sum, d) => sum + d.percent, 0)}%
                </Badge>
                <Button
                  type="button"
                  onClick={autoAdjustPercentages}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  100% 자동조정
                </Button>
              </div>
            </div>

            {designers.map((designer, index) => (
              <div key={designer.id} className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      이름
                    </label>
                    <input
                      type="text"
                      value={designer.name}
                      onChange={(e) => updateDesigner(designer.id, 'name', e.target.value)}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      지분율 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={designer.percent}
                      onChange={(e) => updateDesigner(designer.id, 'percent', Number(e.target.value) || 0)}
                      className="h-8 w-full text-center rounded-md border border-input bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      보너스 (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={designer.bonus_pct}
                      onChange={(e) => updateDesigner(designer.id, 'bonus_pct', Number(e.target.value) || 0)}
                      className="h-8 w-full text-center rounded-md border border-input bg-background text-sm"
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDesigner}
                      className="h-8 px-2"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    {designers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDesigner(designer.id)}
                        className="h-8 px-2"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!result || !projectName.trim() || validationErrors.length > 0}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
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
              {isCalculating ? "계산 중..." : "MZS Studio 정산 규칙에 따른 상세 계산 결과입니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : result && (
              <div className="space-y-6">
                {/* 기본 금액 계산 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">기본 계산</h4>
                  <div className="grid gap-3 text-sm bg-muted/30 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span>총 금액 (T)</span>
                      <span className="font-mono">{formatCurrency(result.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>부가세 (10%)</span>
                      <span className="font-mono">-{formatCurrency(result.grossAmount - result.netAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-muted-foreground/20">
                      <span>순금액 (B)</span>
                      <span className="font-mono text-primary">{formatCurrency(result.netAmount)}</span>
                    </div>
                    {discountNet > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>할인금액 추가</span>
                          <span className="font-mono">+{formatCurrency(discountNet)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t border-muted-foreground/20">
                          <span>기준금액 (base)</span>
                          <span className="font-mono text-primary">{formatCurrency(result.baseAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 수수료 계산 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">수수료 (순금액 기준)</h4>
                  <div className="grid gap-3 text-sm bg-red-50/50 rounded-lg p-4">
                    <div className="flex justify-between text-red-600">
                      <span>광고비 (10%)</span>
                      <span className="font-mono">-{formatCurrency(result.fees.adFee)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>프로그램비 (3%)</span>
                      <span className="font-mono">-{formatCurrency(result.fees.programFee)}</span>
                    </div>
                    {result.fees.channelFee > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>채널수수료 ({channelFeeRate}%)</span>
                        <span className="font-mono">-{formatCurrency(result.fees.channelFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t border-red-200">
                      <span>총 수수료</span>
                      <span className="font-mono text-red-600">-{formatCurrency(result.totalFees)}</span>
                    </div>
                  </div>
                </div>

                {/* 디자이너별 정산 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">디자이너 정산 (40% 기준)</h4>
                  <div className="space-y-3">
                    {result.designers.map((designer, index) => (
                      <div key={designer.id} className="bg-green-50/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-sm">{designer.name}</h5>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{formatPercentage(designer.percent)}</Badge>
                            {designer.bonus_pct > 0 && (
                              <Badge variant="outline">보너스 {formatPercentage(designer.bonus_pct)}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>기본 지분</span>
                            <span className="font-mono">{formatCurrency(designer.designerAmount)}</span>
                          </div>
                          {designer.bonusAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>보너스</span>
                              <span className="font-mono">+{formatCurrency(designer.bonusAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>원천징수 전</span>
                            <span className="font-mono">{formatCurrency(designer.beforeWithholding)}</span>
                          </div>
                          <div className="flex justify-between text-red-600 text-xs">
                            <span>원천징수 (3.3%)</span>
                            <span className="font-mono">-{formatCurrency(designer.withholdingTax)}</span>
                          </div>
                          <div className="flex justify-between font-medium text-green-600 pt-2 border-t border-green-200">
                            <span>실지급액</span>
                            <span className="font-mono">{formatCurrency(designer.afterWithholding)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최종 요약 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">최종 요약</h4>
                  <div className="grid gap-3 text-sm bg-blue-50/50 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span>기준금액 (base)</span>
                      <span className="font-mono">{formatCurrency(result.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>총 수수료</span>
                      <span className="font-mono">-{formatCurrency(result.totalFees)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>디자이너 총 지급</span>
                      <span className="font-mono">-{formatCurrency(result.totalDesignerPayout)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-blue-200">
                      <span>회사 수익</span>
                      <span className="font-mono text-blue-600">{formatCurrency(result.companyProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* 비율 표시 */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {result.baseAmount > 0 ? ((result.totalDesignerPayout / result.baseAmount) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">디자이너 배분율</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {result.baseAmount > 0 ? ((result.totalFees / result.baseAmount) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">수수료율</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.baseAmount > 0 ? ((result.companyProfit / result.baseAmount) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">회사 수익률</div>
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