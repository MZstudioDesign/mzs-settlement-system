'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Zod 스키마 정의
const contactSchema = z.object({
  type: z.enum(['inbound', 'consultation', 'guide']),
  clientName: z.string().min(1, '클라이언트명은 필수입니다'),
  clientEmail: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  contactMethod: z.enum(['phone', 'email', 'website', 'referral', 'other']),
  referralSource: z.string().optional(),
  projectType: z.string().min(1, '프로젝트 유형을 선택해주세요'),
  projectDescription: z.string().optional(),
  estimatedBudget: z.number().min(0, '예산은 0 이상이어야 합니다'),
  budgetRange: z.enum(['under_1m', '1m_3m', '3m_5m', '5m_10m', 'over_10m']),
  timeline: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']),
  location: z.string().optional(),
  followUpDate: z.string().optional(),
  status: z.enum(['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost']),
  notes: z.string(),
  tags: z.array(z.string()).default([]),
});

const feedSchema = z.object({
  type: z.enum(['under_3', 'over_3']),
  projectName: z.string().min(1, '프로젝트명은 필수입니다'),
  clientName: z.string().min(1, '클라이언트명은 필수입니다'),
  feedbackRound: z.number().min(1, '피드백 라운드는 1 이상이어야 합니다').max(20, '피드백 라운드는 20 이하여야 합니다'),
  feedbackCount: z.number().min(1, '피드백 개수는 1 이상이어야 합니다').max(50, '피드백 개수는 50 이하여야 합니다'),
  feedbackType: z.enum(['concept', 'design', 'copy', 'technical', 'final']),
  satisfaction: z.enum([1, 2, 3, 4, 5]),
  timeSpent: z.number().min(1, '소요 시간은 1분 이상이어야 합니다').max(480, '소요 시간은 480분 이하여야 합니다'),
  complexity: z.enum(['simple', 'medium', 'complex']),
  needsRevision: z.boolean(),
  revisionType: z.enum(['minor', 'major', 'concept']).optional(),
  revisionReason: z.string().optional(),
  clientResponse: z.enum(['positive', 'neutral', 'negative']),
  nextSteps: z.string().optional(),
  notes: z.string(),
});

// 타입 추론
type ContactData = z.infer<typeof contactSchema> & {
  id?: string;
  createdAt: string;
  updatedAt: string;
};

type FeedData = z.infer<typeof feedSchema> & {
  id?: string;
  projectId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
};

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

const FEEDBACK_TYPES = {
  concept: '컨셉/아이디어',
  design: '디자인/비주얼',
  copy: '카피/텍스트',
  technical: '기술/기능',
  final: '최종 검토'
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
  const [newTag, setNewTag] = useState('');

  // Contact Form 초기값
  const contactDefaultValues = {
    type: 'inbound' as const,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    contactMethod: 'phone' as const,
    referralSource: '',
    projectType: '',
    projectDescription: '',
    estimatedBudget: 0,
    budgetRange: 'under_1m' as const,
    timeline: '',
    urgency: 'medium' as const,
    location: '',
    followUpDate: '',
    status: 'new' as const,
    notes: '',
    tags: [],
    ...(initialData && 'type' in initialData ? initialData : {})
  };

  // Feed Form 초기값
  const feedDefaultValues = {
    type: 'under_3' as const,
    projectName: '',
    clientName: '',
    feedbackRound: 1,
    feedbackCount: 1,
    feedbackType: 'design' as const,
    satisfaction: 3 as const,
    timeSpent: 30,
    complexity: 'medium' as const,
    needsRevision: false,
    revisionType: undefined,
    revisionReason: '',
    clientResponse: 'neutral' as const,
    nextSteps: '',
    notes: '',
    ...(initialData && 'feedbackCount' in initialData ? initialData : {})
  };

  // React Hook Form 설정
  const contactForm = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contactDefaultValues,
  });

  const feedForm = useForm({
    resolver: zodResolver(feedSchema),
    defaultValues: feedDefaultValues,
  });

  // Contact Form 제출 핸들러
  const handleSaveContact = (data: z.infer<typeof contactSchema>) => {
    if (onSaveContact) {
      const contactDataWithMeta: ContactData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSaveContact(contactDataWithMeta);
      onClose();
    }
  };

  // Feed Form 제출 핸들러
  const handleSaveFeed = (data: z.infer<typeof feedSchema>) => {
    if (onSaveFeed) {
      const feedDataWithMeta: FeedData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSaveFeed(feedDataWithMeta);
      onClose();
    }
  };

  // 태그 관리
  const addTag = () => {
    const currentTags = contactForm.getValues('tags');
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      contactForm.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = contactForm.getValues('tags');
    contactForm.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const renderContactForm = () => (
    <Form {...contactForm}>
      <form onSubmit={contactForm.handleSubmit(handleSaveContact)} className="space-y-6">
        {/* 컨택 타입 */}
        <FormField
          control={contactForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">컨택 타입</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(CONTACT_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = field.value === key;
                    return (
                      <Card
                        key={key}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => field.onChange(key)}
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 클라이언트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">클라이언트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={contactForm.control}
              name="referralSource"
              render={({ field }) => (
                <FormItem className={contactForm.watch('contactMethod') === 'referral' ? '' : 'hidden'}>
                  <FormLabel>추천인/추천 경로</FormLabel>
                  <FormControl>
                    <Input placeholder="추천해준 사람이나 경로를 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 프로젝트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={contactForm.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 유형 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트 유형을 선택하세요" />
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
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="프로젝트에 대한 간단한 설명을 입력하세요..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={contactForm.control}
                name="estimatedBudget"
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
              <FormField
                control={contactForm.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>예산 범위</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BUDGET_RANGES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormLabel>태그</FormLabel>
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
              {contactForm.watch('tags').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contactForm.watch('tags').map((tag) => (
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

            <FormField
              control={contactForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="추가 정보나 특이사항을 입력하세요..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );

  const renderFeedForm = () => (
    <Form {...feedForm}>
      <form onSubmit={feedForm.handleSubmit(handleSaveFeed)} className="space-y-6">
        {/* 피드 타입 */}
        <FormField
          control={feedForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">피드백 유형</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      field.value === 'under_3' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => field.onChange('under_3')}
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
                      field.value === 'over_3' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => field.onChange('over_3')}
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 프로젝트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={feedForm.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>프로젝트명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="프로젝트명을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={feedForm.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>클라이언트명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="클라이언트명을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={feedForm.control}
                name="feedbackRound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백 라운드</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="20"
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
                name="feedbackCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백 개수</FormLabel>
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
                name="feedbackType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백 종류</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={feedForm.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>복잡도</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simple">단순</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="complex">복잡</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          className="w-12 h-12"
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

            <FormField
              control={feedForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>피드백 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="피드백 내용이나 추가 정보를 상세히 입력하세요..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
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
            <Button onClick={contactForm.handleSubmit(handleSaveContact)} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              컨택 정보 저장
            </Button>
          ) : (
            <Button onClick={feedForm.handleSubmit(handleSaveFeed)} className="flex-1">
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