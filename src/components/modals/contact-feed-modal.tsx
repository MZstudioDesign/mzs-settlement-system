'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  X,
  MessageSquare,
  Star,
  Clock,
  Calendar,
  Phone,
  Mail,
  Globe,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCurrency } from "@/lib/currency";

interface ContactData {
  id?: string;
  type: 'inbound' | 'consultation' | 'guide';
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  contactMethod: 'phone' | 'email' | 'website' | 'referral' | 'other';
  referralSource?: string;
  projectType: string;
  projectDescription?: string;
  estimatedBudget: number;
  budgetRange: 'under_1m' | '1m_3m' | '3m_5m' | '5m_10m' | 'over_10m';
  timeline?: string;
  urgency: 'low' | 'medium' | 'high';
  location?: string;
  followUpDate?: string;
  status: 'new' | 'contacted' | 'quoted' | 'negotiating' | 'won' | 'lost';
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface FeedData {
  id?: string;
  type: 'under_3' | 'over_3';
  projectId?: string;
  projectName: string;
  clientName: string;
  feedbackRound: number;
  feedbackCount: number;
  feedbackType: 'concept' | 'design' | 'copy' | 'technical' | 'final';
  satisfaction: 1 | 2 | 3 | 4 | 5;
  timeSpent: number; // 분
  complexity: 'simple' | 'medium' | 'complex';
  needsRevision: boolean;
  revisionType?: 'minor' | 'major' | 'concept';
  revisionReason?: string;
  clientResponse: 'positive' | 'neutral' | 'negative';
  nextSteps?: string;
  notes: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ContactFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContact?: (data: ContactData) => void;
  onSaveFeed?: (data: FeedData) => void;
  initialData?: Partial<ContactData | FeedData>;
  defaultTab?: 'contact' | 'feed';
  mode?: 'create' | 'edit';
}

const CONTACT_TYPES = {
  inbound: { label: '신규 유입', icon: TrendingUp, description: '새로운 잠재 고객 유입' },
  consultation: { label: '상담 진행', icon: MessageSquare, description: '프로젝트 상담 중' },
  guide: { label: '가이드 제공', icon: CheckCircle, description: '프로젝트 가이드 제공' }
};

const CONTACT_METHODS = {
  phone: { label: '전화', icon: Phone },
  email: { label: '이메일', icon: Mail },
  website: { label: '웹사이트', icon: Globe },
  referral: { label: '추천', icon: Users },
  other: { label: '기타', icon: MessageSquare }
};

const BUDGET_RANGES = {
  under_1m: '100만원 미만',
  '1m_3m': '100만원 ~ 300만원',
  '3m_5m': '300만원 ~ 500만원',
  '5m_10m': '500만원 ~ 1000만원',
  over_10m: '1000만원 이상'
};

const PROJECT_TYPES = [
  '브랜드 아이덴티티',
  '웹 디자인',
  '앱 디자인',
  '인쇄 디자인',
  '패키지 디자인',
  '마케팅 디자인',
  '일러스트레이션',
  '영상/모션',
  '공간 디자인',
  '기타'
];

const URGENCY_LEVELS = {
  low: { label: '낮음', color: 'bg-gray-100 text-gray-800', description: '여유 있는 일정' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-800', description: '일반적인 우선순위' },
  high: { label: '높음', color: 'bg-red-100 text-red-800', description: '긴급 처리 필요' }
};

const CONTACT_STATUS = {
  new: { label: '신규', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: '연락완료', color: 'bg-green-100 text-green-800' },
  quoted: { label: '견적제공', color: 'bg-purple-100 text-purple-800' },
  negotiating: { label: '협상중', color: 'bg-yellow-100 text-yellow-800' },
  won: { label: '수주성공', color: 'bg-green-100 text-green-800' },
  lost: { label: '수주실패', color: 'bg-red-100 text-red-800' }
};

const FEEDBACK_TYPES = {
  concept: '컨셉/아이디어',
  design: '디자인/비주얼',
  copy: '카피/텍스트',
  technical: '기술/기능',
  final: '최종 검토'
};

const COMPLEXITY_LEVELS = {
  simple: { label: '단순', color: 'bg-green-100 text-green-800' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  complex: { label: '복잡', color: 'bg-red-100 text-red-800' }
};

const CLIENT_RESPONSES = {
  positive: { label: '긍정적', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  neutral: { label: '중립적', color: 'bg-gray-100 text-gray-800', icon: Clock },
  negative: { label: '부정적', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export function ContactFeedModal({
  isOpen,
  onClose,
  onSaveContact,
  onSaveFeed,
  initialData,
  defaultTab = 'contact',
  mode = 'create'
}: ContactFeedModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Contact Form State
  const [contactData, setContactData] = useState<ContactData>({
    type: 'inbound',
    clientName: '',
    contactMethod: 'phone',
    projectType: '',
    estimatedBudget: 0,
    budgetRange: 'under_1m',
    urgency: 'medium',
    status: 'new',
    notes: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(initialData && 'type' in initialData ? initialData : {})
  });

  // Feed Form State
  const [feedData, setFeedData] = useState<FeedData>({
    type: 'under_3',
    projectName: '',
    clientName: '',
    feedbackRound: 1,
    feedbackCount: 1,
    feedbackType: 'design',
    satisfaction: 3,
    timeSpent: 30,
    complexity: 'medium',
    needsRevision: false,
    clientResponse: 'neutral',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(initialData && 'feedbackCount' in initialData ? initialData : {})
  });

  const [newTag, setNewTag] = useState('');

  const handleSaveContact = () => {
    if (onSaveContact && contactData.clientName.trim() && contactData.projectType) {
      onSaveContact({
        ...contactData,
        updatedAt: new Date().toISOString()
      });
      onClose();
    }
  };

  const handleSaveFeed = () => {
    if (onSaveFeed && feedData.projectName.trim() && feedData.clientName.trim()) {
      onSaveFeed({
        ...feedData,
        updatedAt: new Date().toISOString()
      });
      onClose();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !contactData.tags.includes(newTag.trim())) {
      setContactData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setContactData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderContactForm = () => (
    <div className="space-y-6">
      {/* 컨택 타입 */}
      <div className="space-y-3">
        <Label className="text-base font-medium">컨택 타입</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(CONTACT_TYPES).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = contactData.type === key;
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setContactData(prev => ({ ...prev, type: key as any }))}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 클라이언트 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">클라이언트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="client-email">이메일</Label>
              <Input
                id="client-email"
                type="email"
                value={contactData.clientEmail || ''}
                onChange={(e) => setContactData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-phone">연락처</Label>
              <Input
                id="client-phone"
                value={contactData.clientPhone || ''}
                onChange={(e) => setContactData(prev => ({ ...prev, clientPhone: e.target.value }))}
                placeholder="010-1234-5678"
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
                  {Object.entries(CONTACT_METHODS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <config.icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {contactData.contactMethod === 'referral' && (
            <div className="space-y-2">
              <Label htmlFor="referral-source">추천인/추천 경로</Label>
              <Input
                id="referral-source"
                value={contactData.referralSource || ''}
                onChange={(e) => setContactData(prev => ({ ...prev, referralSource: e.target.value }))}
                placeholder="추천해준 사람이나 경로를 입력하세요"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프로젝트 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>프로젝트 유형 *</Label>
            <Select
              value={contactData.projectType}
              onValueChange={(value) => setContactData(prev => ({ ...prev, projectType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">프로젝트 설명</Label>
            <Textarea
              id="project-description"
              value={contactData.projectDescription || ''}
              onChange={(e) => setContactData(prev => ({ ...prev, projectDescription: e.target.value }))}
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>예상 예산</Label>
              <MoneyInput
                value={contactData.estimatedBudget}
                onChange={(value) => setContactData(prev => ({ ...prev, estimatedBudget: value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>예산 범위</Label>
              <Select
                value={contactData.budgetRange}
                onValueChange={(value: any) => setContactData(prev => ({ ...prev, budgetRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUDGET_RANGES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeline">희망 일정</Label>
              <Input
                id="timeline"
                value={contactData.timeline || ''}
                onChange={(e) => setContactData(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="예: 4주 내, 연말까지"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">위치/지역</Label>
              <Input
                id="location"
                value={contactData.location || ''}
                onChange={(e) => setContactData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="예: 서울, 부산"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 우선순위 및 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">우선순위 및 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>우선순위</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(URGENCY_LEVELS).map(([key, config]) => {
                const isSelected = contactData.urgency === key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col space-y-1"
                    onClick={() => setContactData(prev => ({ ...prev, urgency: key as any }))}
                  >
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs opacity-70">{config.description}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>진행 상태</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(CONTACT_STATUS).map(([key, config]) => {
                const isSelected = contactData.status === key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContactData(prev => ({ ...prev, status: key as any }))}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* 태그 및 메모 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>태그</Label>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="태그 입력"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                추가
              </Button>
            </div>
            {contactData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contactData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              value={contactData.notes}
              onChange={(e) => setContactData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="추가 정보나 특이사항을 입력하세요..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeedForm = () => (
    <div className="space-y-6">
      {/* 피드 타입 */}
      <div className="space-y-3">
        <Label className="text-base font-medium">피드백 유형</Label>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer transition-all ${
              feedData.type === 'under_3' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => setFeedData(prev => ({ ...prev, type: 'under_3' }))}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <Star className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium">3개 미만</p>
                  <p className="text-xs text-muted-foreground">간단한 수정사항</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              feedData.type === 'over_3' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => setFeedData(prev => ({ ...prev, type: 'over_3' }))}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <Star className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium">3개 이상</p>
                  <p className="text-xs text-muted-foreground">많은 수정사항</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 프로젝트 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed-project">프로젝트명 *</Label>
              <Input
                id="feed-project"
                value={feedData.projectName}
                onChange={(e) => setFeedData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="프로젝트명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feed-client">클라이언트명 *</Label>
              <Input
                id="feed-client"
                value={feedData.clientName}
                onChange={(e) => setFeedData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="클라이언트명을 입력하세요"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-round">피드백 라운드</Label>
              <Input
                id="feedback-round"
                type="number"
                min="1"
                max="20"
                value={feedData.feedbackRound}
                onChange={(e) => setFeedData(prev => ({ ...prev, feedbackRound: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-count">피드백 개수</Label>
              <Input
                id="feedback-count"
                type="number"
                min="1"
                max="50"
                value={feedData.feedbackCount}
                onChange={(e) => setFeedData(prev => ({ ...prev, feedbackCount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>피드백 종류</Label>
              <Select
                value={feedData.feedbackType}
                onValueChange={(value: any) => setFeedData(prev => ({ ...prev, feedbackType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 피드백 세부사항 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">피드백 세부사항</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>복잡도</Label>
              <Select
                value={feedData.complexity}
                onValueChange={(value: any) => setFeedData(prev => ({ ...prev, complexity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPLEXITY_LEVELS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>클라이언트 만족도</Label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant={feedData.satisfaction === rating ? "default" : "outline"}
                  size="sm"
                  className="w-12 h-12"
                  onClick={() => setFeedData(prev => ({ ...prev, satisfaction: rating as any }))}
                >
                  {rating}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1: 매우 불만족, 2: 불만족, 3: 보통, 4: 만족, 5: 매우 만족
            </p>
          </div>

          <div className="space-y-3">
            <Label>클라이언트 반응</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CLIENT_RESPONSES).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = feedData.clientResponse === key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col space-y-1"
                    onClick={() => setFeedData(prev => ({ ...prev, clientResponse: key as any }))}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 수정 사항 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">수정 사항</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="needs-revision"
              checked={feedData.needsRevision}
              onChange={(e) => setFeedData(prev => ({ ...prev, needsRevision: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="needs-revision">수정이 필요합니다</Label>
          </div>

          {feedData.needsRevision && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
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

              <div className="space-y-2">
                <Label htmlFor="revision-reason">수정 사유</Label>
                <Textarea
                  id="revision-reason"
                  value={feedData.revisionReason || ''}
                  onChange={(e) => setFeedData(prev => ({ ...prev, revisionReason: e.target.value }))}
                  placeholder="수정이 필요한 이유를 입력하세요..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="next-steps">다음 단계</Label>
            <Textarea
              id="next-steps"
              value={feedData.nextSteps || ''}
              onChange={(e) => setFeedData(prev => ({ ...prev, nextSteps: e.target.value }))}
              placeholder="다음에 진행할 작업이나 계획을 입력하세요..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feed-notes">피드백 내용</Label>
            <Textarea
              id="feed-notes"
              value={feedData.notes}
              onChange={(e) => setFeedData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="피드백 내용이나 추가 정보를 상세히 입력하세요..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>{mode === 'edit' ? '수정하기' : '새로 추가하기'}</span>
          </DialogTitle>
          <DialogDescription>
            컨택 정보와 피드백 정보를 입력하고 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>컨택 정보</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>피드백 정보</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="mt-6">
            {renderContactForm()}
          </TabsContent>

          <TabsContent value="feed" className="mt-6">
            {renderFeedForm()}
          </TabsContent>
        </Tabs>

        <div className="flex space-x-2 pt-4 border-t">
          {activeTab === 'contact' ? (
            <Button onClick={handleSaveContact} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              컨택 정보 저장
            </Button>
          ) : (
            <Button onClick={handleSaveFeed} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              피드백 정보 저장
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}