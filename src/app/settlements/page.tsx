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
import { Switch } from "@/components/ui/switch";
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
  FileText,
  Calculator,
  Eye,
  Edit,
  Check,
  X,
  Calendar,
  DollarSign,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Printer
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
const mockSettlements = [
  {
    id: '1',
    ym: '2024-01',
    note: '2024년 1월 정산',
    createdAt: '2024-02-01',
    status: 'COMPLETED',
    totalAmount: 45600000,
    settledAmount: 18240000,
    memberCount: 6,
    itemCount: 45
  },
  {
    id: '2',
    ym: '2024-02',
    note: '2024년 2월 정산',
    createdAt: '2024-03-01',
    status: 'PENDING',
    totalAmount: 52300000,
    settledAmount: 20920000,
    memberCount: 6,
    itemCount: 52
  },
  {
    id: '3',
    ym: '2024-03',
    note: '2024년 3월 정산 (진행중)',
    createdAt: '2024-03-15',
    status: 'DRAFT',
    totalAmount: 38900000,
    settledAmount: 15560000,
    memberCount: 6,
    itemCount: 38
  }
];

const mockSettlementItems = [
  {
    id: '1',
    member: { name: '오유택', code: 'OY' },
    designerAmount: 3200000,
    contactAmount: 8000,
    feedAmount: 4000,
    teamAmount: 150000,
    mileageAmount: 0,
    bonusAmount: 480000,
    totalBeforeWithholding: 3842000,
    withholdingAmount: 126786,
    totalAfterWithholding: 3715214,
    paid: true,
    paidDate: '2024-02-05',
    memo: ''
  },
  {
    id: '2',
    member: { name: '이예천', code: 'LE' },
    designerAmount: 3120000,
    contactAmount: 6000,
    feedAmount: 2000,
    teamAmount: 200000,
    mileageAmount: 0,
    bonusAmount: 374400,
    totalBeforeWithholding: 3702400,
    withholdingAmount: 122179,
    totalAfterWithholding: 3580221,
    paid: false,
    paidDate: null,
    memo: '다음 주 지급 예정'
  },
  {
    id: '3',
    member: { name: '김연지', code: 'KY' },
    designerAmount: 2760000,
    contactAmount: 4000,
    feedAmount: 1000,
    teamAmount: 100000,
    mileageAmount: 0,
    bonusAmount: 220800,
    totalBeforeWithholding: 3085800,
    withholdingAmount: 101831,
    totalAfterWithholding: 2983969,
    paid: true,
    paidDate: '2024-02-05',
    memo: ''
  }
];

const statusLabels = {
  DRAFT: '초안',
  PENDING: '승인 대기',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function SettlementsPage() {
  const [activeTab, setActiveTab] = useState('settlements');
  const [settlements, setSettlements] = useState(mockSettlements);
  const [settlementItems, setSettlementItems] = useState(mockSettlementItems);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 새 정산 생성 폼 상태
  const [newSettlement, setNewSettlement] = useState({
    ym: '',
    note: ''
  });

  // 필터링된 정산 데이터
  const filteredSettlements = useMemo(() => {
    return settlements.filter(settlement => {
      const matchesSearch = searchTerm === '' ||
        settlement.ym.includes(searchTerm) ||
        settlement.note.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || settlement.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchTerm, statusFilter]);

  // 통계 계산
  const settlementStats = useMemo(() => {
    const totalSettlements = settlements.length;
    const completedSettlements = settlements.filter(s => s.status === 'COMPLETED').length;
    const pendingSettlements = settlements.filter(s => s.status === 'PENDING').length;
    const totalAmount = settlements.reduce((sum, s) => sum + s.settledAmount, 0);

    return {
      totalSettlements,
      completedSettlements,
      pendingSettlements,
      totalAmount,
      completionRate: totalSettlements > 0 ? (completedSettlements / totalSettlements * 100).toFixed(1) : 0
    };
  }, [settlements]);

  // 정산 항목 통계
  const itemStats = useMemo(() => {
    if (!selectedSettlement) return null;

    const items = settlementItems.filter(item => true); // 실제로는 selectedSettlement.id로 필터링
    const totalBeforeWithholding = items.reduce((sum, item) => sum + item.totalBeforeWithholding, 0);
    const totalAfterWithholding = items.reduce((sum, item) => sum + item.totalAfterWithholding, 0);
    const totalWithholding = items.reduce((sum, item) => sum + item.withholdingAmount, 0);
    const paidCount = items.filter(item => item.paid).length;
    const unpaidCount = items.filter(item => !item.paid).length;

    return {
      totalItems: items.length,
      paidCount,
      unpaidCount,
      totalBeforeWithholding,
      totalAfterWithholding,
      totalWithholding
    };
  }, [selectedSettlement, settlementItems]);

  const handleCreateSettlement = () => {
    if (!newSettlement.ym) return;

    const settlement = {
      id: Date.now().toString(),
      ym: newSettlement.ym,
      note: newSettlement.note || `${newSettlement.ym} 정산`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      totalAmount: 0, // 실제로는 계산된 값
      settledAmount: 0, // 실제로는 계산된 값
      memberCount: 6,
      itemCount: 0
    };

    setSettlements([settlement, ...settlements]);
    setNewSettlement({ ym: '', note: '' });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSettlementStatus = (settlementId, status) => {
    setSettlements(settlements.map(s =>
      s.id === settlementId ? { ...s, status } : s
    ));
  };

  const handleTogglePaid = (itemId) => {
    setSettlementItems(settlementItems.map(item =>
      item.id === itemId ? {
        ...item,
        paid: !item.paid,
        paidDate: !item.paid ? new Date().toISOString().split('T')[0] : null
      } : item
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generateYearMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = -6; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const ym = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
      options.push({ value: ym, label });
    }
    return options;
  };

  return (
    <MainLayout title="정산 관리" subtitle="월별 정산 생성 및 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">정산 관리</h1>
            <p className="text-muted-foreground">
              월별 정산을 생성하고 지급 상태를 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              전체 내보내기
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 정산 생성
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>새 정산 생성</DialogTitle>
                  <DialogDescription>
                    새로운 월별 정산을 생성하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ym">정산 월</Label>
                    <Select value={newSettlement.ym} onValueChange={(value) => setNewSettlement({...newSettlement, ym: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="정산 월 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateYearMonthOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">메모</Label>
                    <Textarea
                      id="note"
                      placeholder="정산에 대한 메모를 입력하세요"
                      value={newSettlement.note}
                      onChange={(e) => setNewSettlement({...newSettlement, note: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateSettlement} disabled={!newSettlement.ym}>
                    생성
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
                전체 정산
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settlementStats.totalSettlements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                완료된 정산
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{settlementStats.completedSettlements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                대기중 정산
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{settlementStats.pendingSettlements}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                완료율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{settlementStats.completionRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 정산 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(settlementStats.totalAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settlements">정산 목록</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedSettlement}>
              정산 상세 {selectedSettlement && `(${selectedSettlement.ym})`}
            </TabsTrigger>
          </TabsList>

          {/* 정산 목록 탭 */}
          <TabsContent value="settlements" className="space-y-6">
            {/* 필터 및 검색 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="정산 월, 메모로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      <SelectItem value="DRAFT">초안</SelectItem>
                      <SelectItem value="PENDING">승인 대기</SelectItem>
                      <SelectItem value="COMPLETED">완료</SelectItem>
                      <SelectItem value="CANCELLED">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 정산 목록 테이블 */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>정산 월</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>총 매출</TableHead>
                      <TableHead>정산 금액</TableHead>
                      <TableHead>대상 인원</TableHead>
                      <TableHead>항목 수</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettlements.map(settlement => (
                      <TableRow
                        key={settlement.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedSettlement(settlement)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{settlement.ym}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {settlement.note}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[settlement.status]}>
                            {statusLabels[settlement.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(settlement.totalAmount)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(settlement.settledAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {settlement.memberCount}명
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            {settlement.itemCount}개
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>작업</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedSettlement(settlement);
                                setActiveTab('details');
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                PDF 내보내기
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                CSV 내보내기
                              </DropdownMenuItem>
                              {settlement.status === 'DRAFT' && (
                                <DropdownMenuItem onClick={() => handleUpdateSettlementStatus(settlement.id, 'PENDING')}>
                                  <Check className="h-4 w-4 mr-2" />
                                  승인 대기로 변경
                                </DropdownMenuItem>
                              )}
                              {settlement.status === 'PENDING' && (
                                <DropdownMenuItem onClick={() => handleUpdateSettlementStatus(settlement.id, 'COMPLETED')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  완료 처리
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {filteredSettlements.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">정산이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    새로운 월별 정산을 생성해보세요
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 정산 생성
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 정산 상세 탭 */}
          <TabsContent value="details" className="space-y-6">
            {selectedSettlement && (
              <>
                {/* 정산 정보 카드 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {selectedSettlement.ym} 정산
                        </CardTitle>
                        <CardDescription>{selectedSettlement.note}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={statusColors[selectedSettlement.status]}>
                          {statusLabels[selectedSettlement.status]}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4 mr-2" />
                          인쇄
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {itemStats && (
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">전체 항목</p>
                          <p className="text-2xl font-bold">{itemStats.totalItems}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">지급 완료</p>
                          <p className="text-2xl font-bold text-green-600">{itemStats.paidCount}</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">지급 대기</p>
                          <p className="text-2xl font-bold text-yellow-600">{itemStats.unpaidCount}</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">원천징수전</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(itemStats.totalBeforeWithholding)}</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">실지급액</p>
                          <p className="text-xl font-bold text-purple-600">{formatCurrency(itemStats.totalAfterWithholding)}</p>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* 정산 항목 테이블 */}
                <Card>
                  <CardHeader>
                    <CardTitle>정산 상세 내역</CardTitle>
                    <CardDescription>
                      개인별 정산 내역과 지급 상태를 관리하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>팀원</TableHead>
                          <TableHead>디자인</TableHead>
                          <TableHead>컨택</TableHead>
                          <TableHead>피드</TableHead>
                          <TableHead>팀업무</TableHead>
                          <TableHead>보너스</TableHead>
                          <TableHead>원천전</TableHead>
                          <TableHead>원천징수</TableHead>
                          <TableHead>실지급</TableHead>
                          <TableHead>지급상태</TableHead>
                          <TableHead>메모</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementItems.map(item => (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                                  {item.member.code}
                                </div>
                                <span className="font-medium">{item.member.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(item.designerAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(item.contactAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(item.feedAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(item.teamAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {formatCurrency(item.bonusAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">
                              {formatCurrency(item.totalBeforeWithholding)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-red-600">
                              -{formatCurrency(item.withholdingAmount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-bold text-green-600">
                              {formatCurrency(item.totalAfterWithholding)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.paid}
                                  onCheckedChange={() => handleTogglePaid(item.id)}
                                />
                                <Badge variant="secondary" className={item.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {item.paid ? '지급완료' : '지급대기'}
                                </Badge>
                              </div>
                              {item.paid && item.paidDate && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.paidDate).toLocaleDateString('ko-KR')}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-32 truncate text-xs">
                              {item.memo || '-'}
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
                                    메모 편집
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    재계산
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}