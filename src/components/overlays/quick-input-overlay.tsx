'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Save,
  X,
  MessageSquare,
  Star,
  Calculator,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCurrency } from "@/lib/currency";

interface QuickContactData {
  type: 'inbound' | 'consultation' | 'guide';
  clientName: string;
  contactMethod: 'phone' | 'email' | 'website' | 'referral' | 'other';
  projectType: string;
  budget: number;
  notes: string;
  location?: string;
  urgency: 'low' | 'medium' | 'high';
  followUpDate?: string;
}

interface QuickFeedData {
  type: 'under_3' | 'over_3';
  clientName: string;
  projectName: string;
  feedCount: number;
  satisfaction: 1 | 2 | 3 | 4 | 5;
  notes: string;
  timeSpent: number; // 시간 (분)
  needsRevision: boolean;
  revisionType?: 'minor' | 'major' | 'concept';
}

interface QuickSettlementData {
  projectName: string;
  clientName: string;
  totalAmount: number;
  designerName: string;
  incentiveRate: number;
  notes: string;
}

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
  guide: { label: '가이드', icon: MapPin, color: 'bg-purple-100 text-purple-800' }
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
  // Contact Form State
  const [contactData, setContactData] = useState<QuickContactData>({
    type: 'inbound',
    clientName: '',
    contactMethod: 'phone',
    projectType: '',
    budget: 0,
    notes: '',
    urgency: 'medium'
  });

  // Feed Form State
  const [feedData, setFeedData] = useState<QuickFeedData>({
    type: 'under_3',
    clientName: '',
    projectName: '',
    feedCount: 1,
    satisfaction: 3,
    notes: '',
    timeSpent: 30,
    needsRevision: false
  });

  // Settlement Form State
  const [settlementData, setSettlementData] = useState<QuickSettlementData>({
    projectName: '',
    clientName: '',
    totalAmount: 0,
    designerName: '',
    incentiveRate: 0,
    notes: ''
  });

  // 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setContactData({
        type: 'inbound',
        clientName: '',
        contactMethod: 'phone',
        projectType: '',
        budget: 0,
        notes: '',
        urgency: 'medium'
      });
      setFeedData({
        type: 'under_3',
        clientName: '',
        projectName: '',
        feedCount: 1,
        satisfaction: 3,
        notes: '',
        timeSpent: 30,
        needsRevision: false
      });
      setSettlementData({
        projectName: '',
        clientName: '',
        totalAmount: 0,
        designerName: '',
        incentiveRate: 0,
        notes: ''
      });
    }
  }, [isOpen]);

  const handleSave = () => {
    let dataToSave;
    let isValid = false;

    switch (type) {
      case 'contact':
        isValid = contactData.clientName.trim() !== '' && contactData.projectType !== '';
        dataToSave = contactData;
        break;
      case 'feed':
        isValid = feedData.clientName.trim() !== '' && feedData.projectName.trim() !== '';
        dataToSave = feedData;
        break;
      case 'settlement':
        isValid = settlementData.projectName.trim() !== '' &&
                  settlementData.clientName.trim() !== '' &&
                  settlementData.totalAmount > 0 &&
                  settlementData.designerName !== '';
        dataToSave = settlementData;
        break;
    }

    if (isValid && dataToSave) {
      onSave(dataToSave);
      onClose();
    }
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
    <div className="space-y-4">
      {/* 컨택 타입 */}
      <div className="space-y-2">
        <Label>컨택 타입</Label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(CONTACT_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = contactData.type === key;
            return (
              <Button
                key={key}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="flex flex-col items-center h-16 space-y-1"
                onClick={() => setContactData(prev => ({ ...prev, type: key as any }))}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">클라이언트명 *</Label>
          <Input
            id="client-name"
            value={contactData.clientName}
            onChange={(e) => setContactData(prev => ({ ...prev, clientName: e.target.value }))}
            placeholder="회사명 또는 개인명"
          />
        </div>
        <div className="space-y-2">
          <Label>컨택 방법</Label>
          <Select
            value={contactData.contactMethod}
            onValueChange={(value: any) => setContactData(prev => ({ ...prev, contactMethod: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_METHODS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>프로젝트 유형 *</Label>
          <Select
            value={contactData.projectType}
            onValueChange={(value) => setContactData(prev => ({ ...prev, projectType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>예상 예산</Label>
          <MoneyInput
            value={contactData.budget}
            onChange={(value) => setContactData(prev => ({ ...prev, budget: value }))}
            placeholder="0"
          />
        </div>
      </div>

      {/* 우선순위 */}
      <div className="space-y-2">
        <Label>우선순위</Label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(URGENCY_CONFIG).map(([key, config]) => {
            const isSelected = contactData.urgency === key;
            return (
              <Button
                key={key}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setContactData(prev => ({ ...prev, urgency: key as any }))}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 팔로업 날짜 */}
      <div className="space-y-2">
        <Label htmlFor="follow-up">팔로업 날짜</Label>
        <div className="relative">
          <Input
            id="follow-up"
            type="date"
            value={contactData.followUpDate || ''}
            onChange={(e) => setContactData(prev => ({ ...prev, followUpDate: e.target.value }))}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={contactData.notes}
          onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="추가 정보나 특이사항을 입력하세요..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderFeedForm = () => (
    <div className="space-y-4">
      {/* 피드 타입 */}
      <div className="space-y-2">
        <Label>피드 타입</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={feedData.type === 'under_3' ? "default" : "outline"}
            className="flex flex-col items-center h-16 space-y-1"
            onClick={() => setFeedData(prev => ({ ...prev, type: 'under_3' }))}
          >
            <Star className="h-4 w-4" />
            <span className="text-xs">3개 미만</span>
          </Button>
          <Button
            type="button"
            variant={feedData.type === 'over_3' ? "default" : "outline"}
            className="flex flex-col items-center h-16 space-y-1"
            onClick={() => setFeedData(prev => ({ ...prev, type: 'over_3' }))}
          >
            <Star className="h-4 w-4" />
            <span className="text-xs">3개 이상</span>
          </Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feed-client">클라이언트명 *</Label>
          <Input
            id="feed-client"
            value={feedData.clientName}
            onChange={(e) => setFeedData(prev => ({ ...prev, clientName: e.target.value }))}
            placeholder="클라이언트명"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feed-project">프로젝트명 *</Label>
          <Input
            id="feed-project"
            value={feedData.projectName}
            onChange={(e) => setFeedData(prev => ({ ...prev, projectName: e.target.value }))}
            placeholder="프로젝트명"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feed-count">피드 개수</Label>
          <Input
            id="feed-count"
            type="number"
            min="1"
            max="50"
            value={feedData.feedCount}
            onChange={(e) => setFeedData(prev => ({ ...prev, feedCount: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-spent">소요 시간 (분)</Label>
          <Input
            id="time-spent"
            type="number"
            min="1"
            max="480"
            value={feedData.timeSpent}
            onChange={(e) => setFeedData(prev => ({ ...prev, timeSpent: Number(e.target.value) }))}
          />
        </div>
      </div>

      {/* 만족도 */}
      <div className="space-y-2">
        <Label>클라이언트 만족도</Label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              type="button"
              variant={feedData.satisfaction === rating ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedData(prev => ({ ...prev, satisfaction: rating as any }))}
            >
              {rating}
            </Button>
          ))}
        </div>
      </div>

      {/* 수정 필요 여부 */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="needs-revision"
            checked={feedData.needsRevision}
            onChange={(e) => setFeedData(prev => ({ ...prev, needsRevision: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="needs-revision">수정 필요</Label>
        </div>

        {feedData.needsRevision && (
          <div className="space-y-2">
            <Label>수정 유형</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'minor', label: '미세조정' },
                { key: 'major', label: '대폭수정' },
                { key: 'concept', label: '컨셉변경' }
              ].map((type) => (
                <Button
                  key={type.key}
                  type="button"
                  variant={feedData.revisionType === type.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedData(prev => ({ ...prev, revisionType: type.key as any }))}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="feed-notes">피드백 내용</Label>
        <Textarea
          id="feed-notes"
          value={feedData.notes}
          onChange={(e) => setFeedData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="피드백 내용이나 추가 정보를 입력하세요..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderSettlementForm = () => {
    // 간단한 정산 계산
    const vatAmount = Math.round(settlementData.totalAmount * 0.1);
    const taxAmount = Math.round((settlementData.totalAmount - vatAmount) * 0.033);
    const netAmount = settlementData.totalAmount - vatAmount - taxAmount;
    const designerShare = Math.round(netAmount * 0.4);
    const incentiveAmount = Math.round(netAmount * (settlementData.incentiveRate / 100));
    const designerTotal = designerShare + incentiveAmount;

    return (
      <div className="space-y-4">
        {/* 프로젝트 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settlement-project">프로젝트명 *</Label>
            <Input
              id="settlement-project"
              value={settlementData.projectName}
              onChange={(e) => setSettlementData(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="프로젝트명"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settlement-client">클라이언트명 *</Label>
            <Input
              id="settlement-client"
              value={settlementData.clientName}
              onChange={(e) => setSettlementData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="클라이언트명"
            />
          </div>
        </div>

        {/* 금액 및 디자이너 */}
        <div className="space-y-2">
          <Label>총 프로젝트 금액 *</Label>
          <MoneyInput
            value={settlementData.totalAmount}
            onChange={(value) => setSettlementData(prev => ({ ...prev, totalAmount: value }))}
            placeholder="0"
            className="text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>담당 디자이너 *</Label>
            <Select
              value={settlementData.designerName}
              onValueChange={(value) => setSettlementData(prev => ({ ...prev, designerName: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="디자이너 선택" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNERS.map((designer) => (
                  <SelectItem key={designer} value={designer}>{designer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>인센티브율 (%)</Label>
            <Input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={settlementData.incentiveRate}
              onChange={(e) => setSettlementData(prev => ({ ...prev, incentiveRate: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>
        </div>

        {/* 계산 결과 미리보기 */}
        {settlementData.totalAmount > 0 && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">정산 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="settlement-notes">메모</Label>
          <Textarea
            id="settlement-notes"
            value={settlementData.notes}
            onChange={(e) => setSettlementData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="추가 정보나 특이사항을 입력하세요..."
            rows={2}
          />
        </div>
      </div>
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
          <Button onClick={handleSave} className="flex-1">
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