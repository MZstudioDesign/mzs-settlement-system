'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MainLayout } from "@/components/layout/main-layout";
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
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Phone,
  MessageCircle,
  BookOpen,
  Calendar,
  Users,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const mockMembers = [
  { id: '1', name: '오유택', code: 'OY' },
  { id: '2', name: '이예천', code: 'LE' },
  { id: '3', name: '김연지', code: 'KY' },
  { id: '4', name: '김하늘', code: 'KH' },
  { id: '5', name: '이정수', code: 'IJ' },
  { id: '6', name: '박지윤', code: 'PJ' }
];

const mockProjects = [
  { id: '1', name: '브랜드 로고 디자인', client: '삼성전자' },
  { id: '2', name: '웹사이트 리뉴얼', client: 'LG전자' },
  { id: '3', name: '패키지 디자인', client: '현대자동차' }
];

const mockContactEvents = [
  {
    id: '1',
    member: { name: '오유택', code: 'OY' },
    project: { name: '브랜드 로고 디자인', client: '삼성전자' },
    eventType: 'INCOMING',
    amount: 1000,
    date: '2024-01-15',
    notes: '첫 컨택, 로고 디자인 문의'
  },
  {
    id: '2',
    member: { name: '이예천', code: 'LE' },
    project: { name: '웹사이트 리뉴얼', client: 'LG전자' },
    eventType: 'CHAT',
    amount: 1000,
    date: '2024-01-14',
    notes: '상세 요구사항 논의'
  },
  {
    id: '3',
    member: { name: '김연지', code: 'KY' },
    project: { name: '패키지 디자인', client: '현대자동차' },
    eventType: 'GUIDE',
    amount: 2000,
    date: '2024-01-13',
    notes: '디자인 가이드라인 제공'
  }
];

const eventTypeLabels = {
  INCOMING: '유입',
  CHAT: '상담',
  GUIDE: '가이드'
};

const eventTypeIcons = {
  INCOMING: Phone,
  CHAT: MessageCircle,
  GUIDE: BookOpen
};

const eventTypeColors = {
  INCOMING: 'bg-blue-100 text-blue-800',
  CHAT: 'bg-green-100 text-green-800',
  GUIDE: 'bg-purple-100 text-purple-800'
};

const eventTypeAmounts = {
  INCOMING: 1000,
  CHAT: 1000,
  GUIDE: 2000
};

export default function ContactsPage() {
  const [events, setEvents] = useState(mockContactEvents);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // 새 컨택 이벤트 폼 상태
  const [newEvent, setNewEvent] = useState({
    memberId: '',
    projectId: '',
    eventType: '',
    notes: ''
  });

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === '' ||
        event.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEventType = eventTypeFilter === '' || event.eventType === eventTypeFilter;
      const matchesMember = memberFilter === '' || event.member.code === memberFilter;

      return matchesSearch && matchesEventType && matchesMember;
    });
  }, [events, searchTerm, eventTypeFilter, memberFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalAmount = events.reduce((sum, event) => sum + event.amount, 0);
    const eventTypeCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: events.length,
      totalAmount,
      incoming: eventTypeCounts.INCOMING || 0,
      chat: eventTypeCounts.CHAT || 0,
      guide: eventTypeCounts.GUIDE || 0
    };
  }, [events]);

  const handleAddEvent = () => {
    if (!newEvent.memberId || !newEvent.eventType) return;

    const member = mockMembers.find(m => m.id === newEvent.memberId);
    const project = newEvent.projectId ? mockProjects.find(p => p.id === newEvent.projectId) : null;

    const event = {
      id: Date.now().toString(),
      member: { name: member.name, code: member.code },
      project: project ? { name: project.name, client: project.client } : null,
      eventType: newEvent.eventType,
      amount: eventTypeAmounts[newEvent.eventType],
      date: new Date().toISOString().split('T')[0],
      notes: newEvent.notes
    };

    setEvents([event, ...events]);
    setNewEvent({ memberId: '', projectId: '', eventType: '', notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MainLayout title="컨택 관리" subtitle="고객 컨택 이벤트 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">컨택 관리</h1>
            <p className="text-muted-foreground">
              유입, 상담, 가이드 이벤트를 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 컨택
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>새 컨택 이벤트</DialogTitle>
                  <DialogDescription>
                    새로운 컨택 이벤트를 등록하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member">담당자</Label>
                    <Select value={newEvent.memberId} onValueChange={(value) => setNewEvent({...newEvent, memberId: value})}>
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
                  <div className="space-y-2">
                    <Label htmlFor="eventType">이벤트 타입</Label>
                    <Select value={newEvent.eventType} onValueChange={(value) => setNewEvent({...newEvent, eventType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="이벤트 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOMING">유입 (₩1,000)</SelectItem>
                        <SelectItem value="CHAT">상담 (₩1,000)</SelectItem>
                        <SelectItem value="GUIDE">가이드 (₩2,000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">연관 프로젝트 (선택)</Label>
                    <Select value={newEvent.projectId} onValueChange={(value) => setNewEvent({...newEvent, projectId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">없음</SelectItem>
                        {mockProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {project.client}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">메모</Label>
                    <Textarea
                      id="notes"
                      placeholder="상세 내용을 입력하세요"
                      value={newEvent.notes}
                      onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddEvent} disabled={!newEvent.memberId || !newEvent.eventType}>
                    등록
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 이벤트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                유입
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.incoming}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                상담
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.chat}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                가이드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.guide}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="담당자, 프로젝트, 클라이언트, 메모로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="이벤트 타입" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    <SelectItem value="INCOMING">유입</SelectItem>
                    <SelectItem value="CHAT">상담</SelectItem>
                    <SelectItem value="GUIDE">가이드</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="담당자" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {mockMembers.map(member => (
                      <SelectItem key={member.id} value={member.code}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 컨택 이벤트 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>이벤트 타입</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => {
                  const Icon = eventTypeIcons[event.eventType];
                  return (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {new Date(event.date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {event.member.code}
                          </div>
                          <span className="font-medium">{event.member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={eventTypeColors[event.eventType]}>
                          <Icon className="h-3 w-3 mr-1" />
                          {eventTypeLabels[event.eventType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.project ? (
                          <div>
                            <div className="font-medium text-sm">{event.project.name}</div>
                            <div className="text-xs text-muted-foreground">{event.project.client}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(event.amount)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {event.notes || '-'}
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
          </CardContent>
        </Card>

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
    </MainLayout>
  );
}