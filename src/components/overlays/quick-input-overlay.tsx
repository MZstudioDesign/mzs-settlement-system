'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Save,
  X,
  MessageSquare,
  Star,
  Calculator,
  Phone,
  Mail,
  Globe,
  Users,
  Calendar
} from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCurrency } from "@/lib/currency";

// Zod 스키마 정의
const quickContactSchema = z.object({
  type: z.enum(['inbound', 'consultation', 'guide']),
  clientName: z.string().min(1, '클라이언트명은 필수입니다'),
  contactMethod: z.enum(['phone', 'email', 'website', 'referral', 'other']),
  projectType: z.string().min(1, '프로젝트 유형을 선택해주세요'),
  budget: z.number().min(0, '예산은 0 이상이어야 합니다'),
  notes: z.string(),
  location: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']),
  followUpDate: z.string().optional(),
});

const quickFeedSchema = z.object({
  type: z.enum(['under_3', 'over_3']),
  clientName: z.string().min(1, '클라이언트명은 필수입니다'),
  projectName: z.string().min(1, '프로젝트명은 필수입니다'),
  feedCount: z.number().min(1, '피드백 개수는 1 이상이어야 합니다').max(50, '피드백 개수는 50 이하여야 합니다'),
  satisfaction: z.enum([1, 2, 3, 4, 5]),
  notes: z.string(),
  timeSpent: z.number().min(1, '소요 시간은 1분 이상이어야 합니다').max(480, '소요 시간은 480분 이하여야 합니다'),
  needsRevision: z.boolean(),
  revisionType: z.enum(['minor', 'major', 'concept']).optional(),
});

const quickSettlementSchema = z.object({
  projectName: z.string().min(1, '프로젝트명은 필수입니다'),
  clientName: z.string().min(1, '클라이언트명은 필수입니다'),
  totalAmount: z.number().min(1, '총 금액은 1원 이상이어야 합니다'),
  designerName: z.string().min(1, '디자이너를 선택해주세요'),
  incentiveRate: z.number().min(0, '인센티브율은 0% 이상이어야 합니다').max(20, '인센티브율은 20% 이하여야 합니다'),
  notes: z.string(),
});

// 타입 추론
type QuickContactData = z.infer<typeof quickContactSchema>;
type QuickFeedData = z.infer<typeof quickFeedSchema>;
type QuickSettlementData = z.infer<typeof quickSettlementSchema>;

interface QuickInputOverlayProps {
  type: 'contact' | 'feed' | 'settlement';
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuickContactData | QuickFeedData | QuickSettlementData) => void;
  title?: string;
  description?: string;
}

const CONTACT_TYPES = {
  inbound: { label: '유입', icon: Phone, color: 'bg-blue-100 text-blue-800' },
  consultation: { label: '상담', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
  guide: { label: '가이드', icon: Globe, color: 'bg-purple-100 text-purple-800' }
};

const CONTACT_METHODS = {
  phone: '전화',
  email: '이메일',
  website: '웹사이트',
  referral: '추천',
  other: '기타'
};

const PROJECT_TYPES = [
  '브랜드 아이덴티티',
  '웹 디자인',
  '앱 디자인',
  '인쇄 디자인',
  '패키지 디자인',
  '마케팅 디자인',
  '일러스트레이션',
  '기타'
];

const URGENCY_CONFIG = {
  low: { label: '낮음', color: 'bg-gray-100 text-gray-800' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: '높음', color: 'bg-red-100 text-red-800' }
};

const DESIGNERS = ['오유택', '이예천', '김연지', '김하늘', '이정수', '박지윤'];

export function QuickInputOverlay({
  type,
  isOpen,
  onClose,
  onSave,
  title,
  description
}: QuickInputOverlayProps) {
  // Contact Form 설정
  const contactForm = useForm({
    resolver: zodResolver(quickContactSchema),
    defaultValues: {
      type: 'inbound' as const,
      clientName: '',
      contactMethod: 'phone' as const,
      projectType: '',
      budget: 0,
      notes: '',
      location: '',
      urgency: 'medium' as const,
      followUpDate: '',
    },
  });

  // Feed Form 설정
  const feedForm = useForm({
    resolver: zodResolver(quickFeedSchema),
    defaultValues: {
      type: 'under_3' as const,
      clientName: '',
      projectName: '',
      feedCount: 1,
      satisfaction: 3 as const,
      notes: '',
      timeSpent: 30,
      needsRevision: false,
      revisionType: undefined,
    },
  });

  // Settlement Form 설정
  const settlementForm = useForm({
    resolver: zodResolver(quickSettlementSchema),
    defaultValues: {
      projectName: '',
      clientName: '',
      totalAmount: 0,
      designerName: '',
      incentiveRate: 0,
      notes: ''
    },
  });

  // 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      contactForm.reset();
      feedForm.reset();
      settlementForm.reset();
    }
  }, [isOpen, contactForm, feedForm, settlementForm]);

  // Submit 핸들러
  const handleContactSave = (data: QuickContactData) => {
    onSave(data);
    onClose();
  };

  const handleFeedSave = (data: QuickFeedData) => {
    onSave(data);
    onClose();
  };

  const handleSettlementSave = (data: QuickSettlementData) => {
    onSave(data);
    onClose();
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'contact': return '빠른 컨택 입력';
      case 'feed': return '빠른 피드 입력';
      case 'settlement': return '빠른 정산 입력';
      default: return '빠른 입력';
    }
  };

  const getDescription = () => {
    if (description) return description;
    switch (type) {
      case 'contact': return '새로운 클라이언트 컨택 정보를 빠르게 입력하세요.';
      case 'feed': return '프로젝트 피드백 정보를 빠르게 입력하세요.';
      case 'settlement': return '프로젝트 정산 정보를 빠르게 입력하세요.';
      default: return '';
    }
  };

  const renderContactForm = () => (
    <Form {...contactForm}>
      <form onSubmit={contactForm.handleSubmit(handleContactSave)} className="space-y-4">
        {/* 컨택 타입 */}
        <FormField
          control={contactForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>컨택 타입</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CONTACT_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = field.value === key;
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="flex flex-col items-center h-16 space-y-1"
                        onClick={() => field.onChange(key)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={contactForm.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>클라이언트명 *</FormLabel>
                <FormControl>
                  <Input placeholder="회사명 또는 개인명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={contactForm.control}
            name="contactMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>컨택 방법</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CONTACT_METHODS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={contactForm.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트 유형 *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={contactForm.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예상 예산</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 우선순위 */}
        <FormField
          control={contactForm.control}
          name="urgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>우선순위</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(URGENCY_CONFIG).map(([key, config]) => {
                    const isSelected = field.value === key;
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(key)}
                      >
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 팔로업 날짜 */}
        <FormField
          control={contactForm.control}
          name="followUpDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>팔로업 날짜</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="date"
                    {...field}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 메모 */}
        <FormField
          control={contactForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="추가 정보나 특이사항을 입력하세요..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const renderFeedForm = () => (
    <Form {...feedForm}>
      <form onSubmit={feedForm.handleSubmit(handleFeedSave)} className="space-y-4">
        {/* 피드 타입 */}
        <FormField
          control={feedForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>피드 타입</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'under_3' ? "default" : "outline"}
                    className="flex flex-col items-center h-16 space-y-1"
                    onClick={() => field.onChange('under_3')}
                  >
                    <Star className="h-4 w-4" />
                    <span className="text-xs">3개 미만</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'over_3' ? "default" : "outline"}
                    className="flex flex-col items-center h-16 space-y-1"
                    onClick={() => field.onChange('over_3')}
                  >
                    <Star className="h-4 w-4" />
                    <span className="text-xs">3개 이상</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={feedForm.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>클라이언트명 *</FormLabel>
                <FormControl>
                  <Input placeholder="클라이언트명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={feedForm.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트명 *</FormLabel>
                <FormControl>
                  <Input placeholder="프로젝트명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={feedForm.control}
            name="feedCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>피드 개수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={feedForm.control}
            name="timeSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>소요 시간 (분)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="480"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 만족도 */}
        <FormField
          control={feedForm.control}
          name="satisfaction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>클라이언트 만족도</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={field.value === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(rating as any)}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 수정 필요 여부 */}
        <FormField
          control={feedForm.control}
          name="needsRevision"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="needs-revision"
                  checked={field.value}
                  onChange={field.onChange}
                  className="rounded border-gray-300"
                />
                <FormLabel htmlFor="needs-revision">수정 필요</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {feedForm.watch('needsRevision') && (
          <FormField
            control={feedForm.control}
            name="revisionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수정 유형</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'minor', label: '미세조정' },
                      { key: 'major', label: '대폭수정' },
                      { key: 'concept', label: '컨셉변경' }
                    ].map((type) => (
                      <Button
                        key={type.key}
                        type="button"
                        variant={field.value === type.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(type.key as any)}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* 메모 */}
        <FormField
          control={feedForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>피드백 내용</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="피드백 내용이나 추가 정보를 입력하세요..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const renderSettlementForm = () => {
    // 간단한 정산 계산
    const totalAmount = settlementForm.watch('totalAmount');
    const incentiveRate = settlementForm.watch('incentiveRate');

    const vatAmount = Math.round(totalAmount * 0.1);
    const taxAmount = Math.round((totalAmount - vatAmount) * 0.033);
    const netAmount = totalAmount - vatAmount - taxAmount;
    const designerShare = Math.round(netAmount * 0.4);
    const incentiveAmount = Math.round(netAmount * (incentiveRate / 100));
    const designerTotal = designerShare + incentiveAmount;

    return (
      <Form {...settlementForm}>
        <form onSubmit={settlementForm.handleSubmit(handleSettlementSave)} className="space-y-4">
          {/* 프로젝트 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={settlementForm.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="프로젝트명" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={settlementForm.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>클라이언트명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="클라이언트명" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 금액 및 디자이너 */}
          <FormField
            control={settlementForm.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>총 프로젝트 금액 *</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                    className="text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={settlementForm.control}
              name="designerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당 디자이너 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="디자이너 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DESIGNERS.map((designer) => (
                        <SelectItem key={designer} value={designer}>{designer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={settlementForm.control}
              name="incentiveRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>인센티브율 (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 계산 결과 미리보기 */}
          {totalAmount > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-medium">정산 미리보기</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>실입금액</span>
                    <span className="font-mono">{formatCurrency(netAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>디자이너 기본지분</span>
                    <span className="font-mono">{formatCurrency(designerShare)}</span>
                  </div>
                  {incentiveAmount > 0 && (
                    <div className="flex justify-between col-span-2">
                      <span>인센티브</span>
                      <span className="font-mono text-green-600">+{formatCurrency(incentiveAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between col-span-2 pt-2 border-t font-medium">
                    <span>디자이너 총 수령액</span>
                    <span className="font-mono text-primary">{formatCurrency(designerTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 메모 */}
          <FormField
            control={settlementForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="추가 정보나 특이사항을 입력하세요..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  };

  const renderForm = () => {
    switch (type) {
      case 'contact': return renderContactForm();
      case 'feed': return renderFeedForm();
      case 'settlement': return renderSettlementForm();
      default: return null;
    }
  };

  const getSubmitHandler = () => {
    switch (type) {
      case 'contact': return contactForm.handleSubmit(handleContactSave);
      case 'feed': return feedForm.handleSubmit(handleFeedSave);
      case 'settlement': return settlementForm.handleSubmit(handleSettlementSave);
      default: return () => {};
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {type === 'contact' && <MessageSquare className="h-5 w-5" />}
            {type === 'feed' && <Star className="h-5 w-5" />}
            {type === 'settlement' && <Calculator className="h-5 w-5" />}
            <span>{getTitle()}</span>
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderForm()}
        </div>

        <div className="flex space-x-2">
          <Button onClick={getSubmitHandler()} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            저장하기
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}