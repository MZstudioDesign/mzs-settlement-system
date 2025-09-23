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
  MessageSquare,
  Star,
  Calendar,
  Users,
  MoreHorizontal,
  ArrowUpDown,
  TrendingUp,
  DollarSign
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

const mockFeedLogs = [
  {
    id: '1',
    member: { name: '오유택', code: 'OY' },
    feeType: 'GTE3',
    amount: 1000,
    date: '2024-01-15',
    notes: '3개 이상 피드백 완료',
    consumed: false
  },
  {
    id: '2',
    member: { name: '이예천', code: 'LE' },
    feeType: 'BELOW3',
    amount: 400,
    date: '2024-01-14',
    notes: '1개 피드백 작업',
    consumed: true
  },
  {
    id: '3',
    member: { name: '김연지', code: 'KY' },
    feeType: 'GTE3',
    amount: 1000,
    date: '2024-01-13',
    notes: '5개 피드백 완료',
    consumed: false
  },
  {
    id: '4',
    member: { name: '김하늘', code: 'KH' },
    feeType: 'BELOW3',
    amount: 400,
    date: '2024-01-12',
    notes: '2개 피드백 작업',
    consumed: true
  }
];

const feeTypeLabels = {
  BELOW3: '피드 3개 미만',
  GTE3: '피드 3개 이상'
};

const feeTypeAmounts = {
  BELOW3: 400,
  GTE3: 1000
};

const feeTypeColors = {
  BELOW3: 'bg-orange-100 text-orange-800',
  GTE3: 'bg-green-100 text-green-800'
};

export default function FeedPage() {
  const [feedLogs, setFeedLogs] = useState(mockFeedLogs);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 새 피드 로그 폼 상태
  const [newFeedLog, setNewFeedLog] = useState({
    memberId: '',
    feeType: '',
    notes: ''
  });

  // 일괄 현금화 선택
  const [selectedLogs, setSelectedLogs] = useState([]);

  // 필터링된 피드 로그
  const filteredFeedLogs = useMemo(() => {
    return feedLogs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFeeType = feeTypeFilter === '' || log.feeType === feeTypeFilter;
      const matchesMember = memberFilter === '' || log.member.code === memberFilter;
      const matchesStatus = statusFilter === '' ||
        (statusFilter === 'consumed' && log.consumed) ||
        (statusFilter === 'pending' && !log.consumed);

      return matchesSearch && matchesFeeType && matchesMember && matchesStatus;
    });
  }, [feedLogs, searchTerm, feeTypeFilter, memberFilter, statusFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalAmount = feedLogs.reduce((sum, log) => sum + log.amount, 0);
    const pendingAmount = feedLogs.filter(log => !log.consumed).reduce((sum, log) => sum + log.amount, 0);
    const consumedAmount = feedLogs.filter(log => log.consumed).reduce((sum, log) => sum + log.amount, 0);

    const feeTypeCounts = feedLogs.reduce((acc, log) => {
      acc[log.feeType] = (acc[log.feeType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: feedLogs.length,
      totalAmount,
      pendingAmount,
      consumedAmount,
      below3: feeTypeCounts.BELOW3 || 0,
      gte3: feeTypeCounts.GTE3 || 0
    };
  }, [feedLogs]);

  const handleAddFeedLog = () => {
    if (!newFeedLog.memberId || !newFeedLog.feeType) return;

    const member = mockMembers.find(m => m.id === newFeedLog.memberId);

    const feedLog = {
      id: Date.now().toString(),
      member: { name: member.name, code: member.code },
      feeType: newFeedLog.feeType,
      amount: feeTypeAmounts[newFeedLog.feeType],
      date: new Date().toISOString().split('T')[0],
      notes: newFeedLog.notes,
      consumed: false
    };

    setFeedLogs([feedLog, ...feedLogs]);
    setNewFeedLog({ memberId: '', feeType: '', notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleCashOut = (logId) => {
    setFeedLogs(feedLogs.map(log =>
      log.id === logId ? { ...log, consumed: true } : log
    ));
  };

  const handleBatchCashOut = () => {
    setFeedLogs(feedLogs.map(log =>
      selectedLogs.includes(log.id) ? { ...log, consumed: true } : log
    ));
    setSelectedLogs([]);
  };

  const handleDeleteFeedLog = (logId) => {
    setFeedLogs(feedLogs.filter(l => l.id !== logId));
  };

  const toggleSelection = (logId) => {
    setSelectedLogs(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MainLayout title="피드 관리" subtitle="피드백 활동 및 보상 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">피드 관리</h1>
            <p className="text-muted-foreground">
              피드백 활동과 보상을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            {selectedLogs.length > 0 && (
              <Button onClick={handleBatchCashOut} variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                선택 현금화 ({selectedLogs.length})
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 피드 로그
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>새 피드 로그</DialogTitle>
                  <DialogDescription>
                    새로운 피드백 활동을 등록하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member">담당자</Label>
                    <Select value={newFeedLog.memberId} onValueChange={(value) => setNewFeedLog({...newFeedLog, memberId: value})}>
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
                    <Label htmlFor="feeType">피드백 타입</Label>
                    <Select value={newFeedLog.feeType} onValueChange={(value) => setNewFeedLog({...newFeedLog, feeType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="피드백 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELOW3">피드 3개 미만 (₩400)</SelectItem>
                        <SelectItem value="GTE3">피드 3개 이상 (₩1,000)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">메모</Label>
                    <Textarea
                      id="notes"
                      placeholder="피드백 상세 내용을 입력하세요"
                      value={newFeedLog.notes}
                      onChange={(e) => setNewFeedLog({...newFeedLog, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddFeedLog} disabled={!newFeedLog.memberId || !newFeedLog.feeType}>
                    등록
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 빠른 피드 입력 버튼 */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">빠른 피드 입력</CardTitle>
            <CardDescription>
              자주 사용하는 피드백 타입을 빠르게 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {mockMembers.map(member => (
                <div key={member.id} className="space-y-2">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold mb-2">
                      {member.code}
                    </div>
                    <p className="text-sm font-medium">{member.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        const feedLog = {
                          id: Date.now().toString() + member.id + 'below',
                          member: { name: member.name, code: member.code },
                          feeType: 'BELOW3',
                          amount: 400,
                          date: new Date().toISOString().split('T')[0],
                          notes: '빠른 입력',
                          consumed: false
                        };
                        setFeedLogs([feedLog, ...feedLogs]);
                      }}
                    >
                      3개 미만
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        const feedLog = {
                          id: Date.now().toString() + member.id + 'gte',
                          member: { name: member.name, code: member.code },
                          feeType: 'GTE3',
                          amount: 1000,
                          date: new Date().toISOString().split('T')[0],
                          notes: '빠른 입력',
                          consumed: false
                        };
                        setFeedLogs([feedLog, ...feedLogs]);
                      }}
                    >
                      3개 이상
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                3개 미만
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.below3}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                3개 이상
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.gte3}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                현금화 대기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pendingAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                현금화 완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.consumedAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 누적
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
                    placeholder="담당자, 메모로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="피드백 타입" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    <SelectItem value="BELOW3">3개 미만</SelectItem>
                    <SelectItem value="GTE3">3개 이상</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    <SelectItem value="pending">현금화 대기</SelectItem>
                    <SelectItem value="consumed">현금화 완료</SelectItem>
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

        {/* 피드 로그 테이블 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">선택</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>피드백 타입</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id)}
                        onChange={() => toggleSelection(log.id)}
                        disabled={log.consumed}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {log.member.code}
                        </div>
                        <span className="font-medium">{log.member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={feeTypeColors[log.feeType]}>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {feeTypeLabels[log.feeType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(log.amount)}
                    </TableCell>
                    <TableCell>
                      {log.consumed ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          현금화 완료
                        </Badge>
                      ) : (
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            현금화 대기
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCashOut(log.id)}
                          >
                            현금화
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {log.notes || '-'}
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
                            onClick={() => handleDeleteFeedLog(log.id)}
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

        {filteredFeedLogs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">피드 로그가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                새로운 피드백 활동을 등록해보세요
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                첫 피드 로그 등록
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}