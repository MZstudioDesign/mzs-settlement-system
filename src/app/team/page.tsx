'use client'

import { useState, useMemo } from 'react'
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Award,
  Target,
  TrendingUp,
  Briefcase,
  Clock
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
  {
    id: '1',
    name: '오유택',
    code: 'OY',
    joinDate: '2023-01-01',
    position: '시니어 디자이너',
    defaultBonusPct: 15,
    totalTasks: 45,
    totalAmount: 8200000,
    monthlyTasks: 12,
    monthlyAmount: 2100000
  },
  {
    id: '2',
    name: '이예천',
    code: 'LE',
    joinDate: '2023-03-15',
    position: '디자이너',
    defaultBonusPct: 12,
    totalTasks: 38,
    totalAmount: 7800000,
    monthlyTasks: 15,
    monthlyAmount: 2400000
  },
  {
    id: '3',
    name: '김연지',
    code: 'KY',
    joinDate: '2023-06-01',
    position: '주니어 디자이너',
    defaultBonusPct: 8,
    totalTasks: 28,
    totalAmount: 6900000,
    monthlyTasks: 8,
    monthlyAmount: 1800000
  },
  {
    id: '4',
    name: '김하늘',
    code: 'KH',
    joinDate: '2023-08-20',
    position: '디자이너',
    defaultBonusPct: 10,
    totalTasks: 32,
    totalAmount: 6200000,
    monthlyTasks: 10,
    monthlyAmount: 1900000
  },
  {
    id: '5',
    name: '이정수',
    code: 'IJ',
    joinDate: '2023-10-01',
    position: '주니어 디자이너',
    defaultBonusPct: 5,
    totalTasks: 22,
    totalAmount: 5400000,
    monthlyTasks: 7,
    monthlyAmount: 1600000
  },
  {
    id: '6',
    name: '박지윤',
    code: 'PJ',
    joinDate: '2023-11-15',
    position: '인턴 디자이너',
    defaultBonusPct: 3,
    totalTasks: 18,
    totalAmount: 4800000,
    monthlyTasks: 5,
    monthlyAmount: 1200000
  }
];

const mockProjects = [
  { id: '1', name: '브랜드 로고 디자인', client: '삼성전자' },
  { id: '2', name: '웹사이트 리뉴얼', client: 'LG전자' },
  { id: '3', name: '패키지 디자인', client: '현대자동차' }
];

const mockTeamTasks = [
  {
    id: '1',
    member: { name: '오유택', code: 'OY' },
    project: { name: '브랜드 로고 디자인', client: '삼성전자' },
    date: '2024-01-15',
    notes: '브랜드 가이드라인 작성',
    amount: 150000
  },
  {
    id: '2',
    member: { name: '이예천', code: 'LE' },
    project: { name: '웹사이트 리뉴얼', client: 'LG전자' },
    date: '2024-01-14',
    notes: 'UI/UX 컨설팅',
    amount: 200000
  },
  {
    id: '3',
    member: { name: '김연지', code: 'KY' },
    project: null,
    date: '2024-01-13',
    notes: '사내 프로세스 개선',
    amount: 100000
  }
];

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('members');
  const [teamTasks, setTeamTasks] = useState(mockTeamTasks);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // 새 팀 업무 폼 상태
  const [newTask, setNewTask] = useState({
    memberId: '',
    projectId: '',
    notes: '',
    amount: ''
  });

  // 필터링된 팀 업무
  const filteredTasks = useMemo(() => {
    return teamTasks.filter(task => {
      const matchesSearch = searchTerm === '' ||
        task.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.project && task.project.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMember = memberFilter === '' || task.member.code === memberFilter;

      return matchesSearch && matchesMember;
    });
  }, [teamTasks, searchTerm, memberFilter]);

  // 통계 계산
  const teamStats = useMemo(() => {
    const totalTasks = mockMembers.reduce((sum, member) => sum + member.totalTasks, 0);
    const totalAmount = mockMembers.reduce((sum, member) => sum + member.totalAmount, 0);
    const monthlyTasks = mockMembers.reduce((sum, member) => sum + member.monthlyTasks, 0);
    const monthlyAmount = mockMembers.reduce((sum, member) => sum + member.monthlyAmount, 0);

    return {
      totalMembers: mockMembers.length,
      totalTasks,
      totalAmount,
      monthlyTasks,
      monthlyAmount,
      avgTasksPerMember: Math.round(totalTasks / mockMembers.length),
      avgAmountPerMember: Math.round(totalAmount / mockMembers.length)
    };
  }, []);

  const handleAddTask = () => {
    if (!newTask.memberId || !newTask.notes || !newTask.amount) return;

    const member = mockMembers.find(m => m.id === newTask.memberId);
    const project = newTask.projectId ? mockProjects.find(p => p.id === newTask.projectId) : null;

    const task = {
      id: Date.now().toString(),
      member: { name: member.name, code: member.code },
      project: project ? { name: project.name, client: project.client } : null,
      date: new Date().toISOString().split('T')[0],
      notes: newTask.notes,
      amount: parseInt(newTask.amount)
    };

    setTeamTasks([task, ...teamTasks]);
    setNewTask({ memberId: '', projectId: '', notes: '', amount: '' });
    setIsTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId) => {
    setTeamTasks(teamTasks.filter(t => t.id !== taskId));
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditMemberDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MainLayout title="팀 관리" subtitle="팀원 및 업무 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">팀 관리</h1>
            <p className="text-muted-foreground">
              팀원 정보와 업무 활동을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        {/* 팀 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                팀원 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                이달 업무
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{teamStats.monthlyTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                이달 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">{formatCurrency(teamStats.monthlyAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 업무
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 누적 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(teamStats.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 업무/인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{teamStats.avgTasksPerMember}</div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">팀원 관리</TabsTrigger>
            <TabsTrigger value="tasks">팀 업무</TabsTrigger>
          </TabsList>

          {/* 팀원 관리 탭 */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>팀원 정보</CardTitle>
                <CardDescription>
                  팀원들의 기본 정보와 성과를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>팀원</TableHead>
                      <TableHead>직급</TableHead>
                      <TableHead>입사일</TableHead>
                      <TableHead>기본 인센티브</TableHead>
                      <TableHead>이달 업무</TableHead>
                      <TableHead>이달 금액</TableHead>
                      <TableHead>총 업무</TableHead>
                      <TableHead>총 누적</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMembers.map((member, index) => (
                      <TableRow key={member.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                              ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-blue-100 text-blue-800' :
                                index === 2 ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'}
                            `}>
                              {member.code}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(member.joinDate).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {member.defaultBonusPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {member.monthlyTasks}건
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatCurrency(member.monthlyAmount)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {member.totalTasks}건
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatCurrency(member.totalAmount)}
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
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Edit className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 팀 업무 탭 */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">팀 업무 로그</h3>
                <p className="text-sm text-muted-foreground">
                  팀원들의 업무 활동과 금액을 기록하세요
                </p>
              </div>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    새 업무 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 팀 업무</DialogTitle>
                    <DialogDescription>
                      새로운 팀 업무를 등록하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">담당자</Label>
                      <Select value={newTask.memberId} onValueChange={(value) => setNewTask({...newTask, memberId: value})}>
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
                      <Label htmlFor="project">연관 프로젝트 (선택)</Label>
                      <Select value={newTask.projectId} onValueChange={(value) => setNewTask({...newTask, projectId: value})}>
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
                      <Label htmlFor="notes">업무 내용</Label>
                      <Textarea
                        id="notes"
                        placeholder="업무 내용을 상세히 입력하세요"
                        value={newTask.notes}
                        onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">금액</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="금액을 입력하세요"
                        value={newTask.amount}
                        onChange={(e) => setNewTask({...newTask, amount: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddTask} disabled={!newTask.memberId || !newTask.notes || !newTask.amount}>
                      등록
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 필터 및 검색 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="담당자, 업무 내용, 프로젝트로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
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
              </CardContent>
            </Card>

            {/* 팀 업무 테이블 */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>담당자</TableHead>
                      <TableHead>프로젝트</TableHead>
                      <TableHead>업무 내용</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map(task => (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {new Date(task.date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {task.member.code}
                            </div>
                            <span className="font-medium">{task.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.project ? (
                            <div>
                              <div className="font-medium text-sm">{task.project.name}</div>
                              <div className="text-xs text-muted-foreground">{task.project.client}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">일반 업무</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-64">
                          <p className="text-sm">{task.notes}</p>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(task.amount)}
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
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {filteredTasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">팀 업무가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    새로운 팀 업무를 등록해보세요
                  </p>
                  <Button onClick={() => setIsTaskDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 업무 등록
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* 팀원 편집 다이얼로그 */}
        <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>팀원 정보 편집</DialogTitle>
              <DialogDescription>
                {editingMember?.name}의 정보를 수정하세요
              </DialogDescription>
            </DialogHeader>
            {editingMember && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">직급</Label>
                  <Input
                    id="position"
                    value={editingMember.position}
                    onChange={(e) => setEditingMember({...editingMember, position: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusPct">기본 인센티브 (%)</Label>
                  <Input
                    id="bonusPct"
                    type="number"
                    min="0"
                    max="20"
                    value={editingMember.defaultBonusPct}
                    onChange={(e) => setEditingMember({...editingMember, defaultBonusPct: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMemberDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={() => setIsEditMemberDialogOpen(false)}>
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}