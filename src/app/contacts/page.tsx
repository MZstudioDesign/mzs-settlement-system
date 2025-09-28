'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Users, Edit, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';
import { toast } from "sonner";

type EventType = 'INCOMING' | 'CHAT' | 'GUIDE';

interface ContactEvent {
  id: string;
  member_id: string;
  member_name: string;
  date: string;
  event_type: EventType;
  amount: number;
  project_id?: string;
  project_name?: string;
  notes?: string;
}

const mockMembers = [
  { id: '1', name: '오유택', code: 'OY' },
  { id: '2', name: '이예천', code: 'LE' },
  { id: '3', name: '김연지', code: 'KY' },
  { id: '4', name: '김하늘', code: 'KH' },
  { id: '5', name: '이정수', code: 'IJ' },
  { id: '6', name: '박지윤', code: 'PJ' },
];

const mockProjects = [
  { id: '1', name: '카드뉴스 제작', client_name: '클라이언트 A' },
  { id: '2', name: '포스터 디자인', client_name: '클라이언트 B' },
  { id: '3', name: '웹사이트 디자인', client_name: '클라이언트 C' },
];

const eventTypeLabels: Record<EventType, string> = {
  INCOMING: '유입',
  CHAT: '상담',
  GUIDE: '가이드'
};

const eventTypeAmounts: Record<EventType, number> = {
  INCOMING: 1000,
  CHAT: 1000,
  GUIDE: 2000
};

const eventTypeColors: Record<EventType, string> = {
  INCOMING: 'bg-blue-100 text-blue-800',
  CHAT: 'bg-green-100 text-green-800',
  GUIDE: 'bg-purple-100 text-purple-800'
};

export default function ContactsPage() {
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'ALL'>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');

  // 새 컨택 이벤트 폼 상태
  const [newEvent, setNewEvent] = useState({
    member_id: '',
    event_type: 'INCOMING' as EventType,
    project_id: '',
    notes: ''
  });

  // 빠른 입력 상태
  const [quickInputMember, setQuickInputMember] = useState('');

  // 필터링된 이벤트
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || event.event_type === filterType;
    const matchesMember = filterMember === 'ALL' || event.member_id === filterMember;

    return matchesSearch && matchesType && matchesMember;
  });

  // 통계 계산
  const stats = {
    total: events.length,
    incoming: events.filter(e => e.event_type === 'INCOMING').length,
    chat: events.filter(e => e.event_type === 'CHAT').length,
    guide: events.filter(e => e.event_type === 'GUIDE').length,
    totalAmount: events.reduce((sum, e) => sum + e.amount, 0)
  };

  // 빠른 입력 핸들러
  const handleQuickInput = async (eventType: EventType) => {
    if (!quickInputMember) {
      toast.error('담당자를 선택해주세요');
      return;
    }

    const member = mockMembers.find(m => m.id === quickInputMember);
    if (!member) return;

    const newContactEvent: ContactEvent = {
      id: Date.now().toString(),
      member_id: quickInputMember,
      member_name: member.name,
      date: new Date().toISOString().split('T')[0],
      event_type: eventType,
      amount: eventTypeAmounts[eventType],
      project_id: undefined, // 빠른 입력에서는 프로젝트 연결 없음
      project_name: undefined,
      notes: `빠른 입력: ${eventTypeLabels[eventType]}`
    };

    setEvents(prev => [newContactEvent, ...prev]);

    // 성공 피드백
    toast.success(`${eventTypeLabels[eventType]} 이벤트가 등록되었습니다 (₩${eventTypeAmounts[eventType].toLocaleString()})`);
  };

  const handleAddEvent = () => {
    if (!newEvent.member_id || !newEvent.event_type) {
      toast.error('필수 정보를 입력해주세요');
      return;
    }

    const member = mockMembers.find(m => m.id === newEvent.member_id);
    const project = (newEvent.project_id && newEvent.project_id !== 'none') ? mockProjects.find(p => p.id === newEvent.project_id) : null;

    const contactEvent: ContactEvent = {
      id: Date.now().toString(),
      member_id: newEvent.member_id,
      member_name: member?.name || '',
      date: new Date().toISOString().split('T')[0],
      event_type: newEvent.event_type,
      amount: eventTypeAmounts[newEvent.event_type],
      project_id: (newEvent.project_id && newEvent.project_id !== 'none') ? newEvent.project_id : undefined,
      project_name: project ? `${project.name} (${project.client_name})` : undefined,
      notes: newEvent.notes
    };

    setEvents(prev => [contactEvent, ...prev]);
    setIsAddDialogOpen(false);
    setNewEvent({
      member_id: '',
      event_type: 'INCOMING',
      project_id: '',
      notes: ''
    });
    toast.success('컨택 이벤트가 등록되었습니다');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('컨택 이벤트가 삭제되었습니다');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">컨택 관리</h1>
          <p className="text-muted-foreground">고객 컨택 이벤트를 관리하고 추적합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              컨택 이벤트 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 컨택 이벤트 등록</DialogTitle>
              <DialogDescription>
                고객과의 컨택 이벤트 정보를 입력해주세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member">담당자</Label>
                <Select value={newEvent.member_id} onValueChange={(value) => setNewEvent(prev => ({ ...prev, member_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="event_type">이벤트 유형</Label>
                <Select value={newEvent.event_type} onValueChange={(value: EventType) => setNewEvent(prev => ({ ...prev, event_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="이벤트 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOMING">유입 (₩1,000)</SelectItem>
                    <SelectItem value="CHAT">상담 (₩1,000)</SelectItem>
                    <SelectItem value="GUIDE">가이드 (₩2,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project">관련 프로젝트 (선택)</Label>
                <Select value={newEvent.project_id} onValueChange={(value) => setNewEvent(prev => ({ ...prev, project_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="프로젝트 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">연결 안함</SelectItem>
                    {mockProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.client_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="추가 메모사항"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAddEvent}>등록</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* 통계 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 이벤트</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="contact-total-count">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">유입</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">{stats.incoming}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(stats.incoming * 1000).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상담</CardTitle>
            <Badge className="bg-green-100 text-green-800">{stats.chat}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(stats.chat * 1000).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가이드</CardTitle>
            <Badge className="bg-purple-100 text-purple-800">{stats.guide}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{(stats.guide * 2000).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="contact-total-amount">₩{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 입력 패널 */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⚡ 빠른 컨택 입력</span>
          </CardTitle>
          <CardDescription>
            담당자를 선택하고 버튼을 클릭하여 빠르게 컨택 이벤트를 등록하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 min-w-0">
              {/* 담당자 선택 */}
              <Label htmlFor="quickMember">담당자</Label>
              <Select value={quickInputMember} onValueChange={setQuickInputMember}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {mockMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 빠른 입력 버튼들 */}
              <Button
                onClick={() => handleQuickInput('INCOMING')}
                disabled={!quickInputMember}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                data-testid="btn-contact-incoming"
              >
                유입 (₩1,000)
              </Button>
              <Button
                onClick={() => handleQuickInput('CHAT')}
                disabled={!quickInputMember}
                variant="outline"
                className="bg-green-50 hover:bg-green-100 border-green-200"
                data-testid="btn-contact-chat"
              >
                상담 (₩1,000)
              </Button>
              <Button
                onClick={() => handleQuickInput('GUIDE')}
                disabled={!quickInputMember}
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                data-testid="btn-contact-guide"
              >
                가이드 (₩2,000)
              </Button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            {/* 사용법 안내 */}
            <p className="text-sm text-muted-foreground">
              💡 <strong>사용법:</strong> 담당자를 선택하고 해당하는 컨택 유형 버튼을 클릭하세요.
              무제한으로 누적 가능하며, 선택한 담당자에게 자동으로 귀속됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="멤버명, 프로젝트명, 메모 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(value: EventType | 'ALL') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="이벤트 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 유형</SelectItem>
                <SelectItem value="INCOMING">유입</SelectItem>
                <SelectItem value="CHAT">상담</SelectItem>
                <SelectItem value="GUIDE">가이드</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="담당자" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 담당자</SelectItem>
                {mockMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 컨택 이벤트 테이블 */}
      {filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>컨택 이벤트 목록 ({filteredEvents.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>이벤트 유형</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>관련 프로젝트</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead className="w-[100px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {event.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {event.member_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={eventTypeColors[event.event_type]}>
                            {eventTypeLabels[event.event_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₩{event.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {event.project_name ? (
                            <span className="text-sm">{event.project_name}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.notes ? (
                            <span className="text-sm">{event.notes}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>작업</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">컨택 이벤트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              새로운 컨택 이벤트를 등록해보세요
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 컨택 등록
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}