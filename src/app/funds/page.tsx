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
  Upload,
  FileText,
  Image,
  X,
  Eye,
  Building,
  User,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  MoreHorizontal,
  Paperclip
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

const mockCompanyFunds = [
  {
    id: '1',
    date: '2024-01-15',
    item: '사무실 임대료',
    amount: -2000000,
    memo: '1월 사무실 임대료',
    attachments: ['receipt_rent_2024_01.pdf']
  },
  {
    id: '2',
    date: '2024-01-10',
    item: '소프트웨어 라이센스',
    amount: -500000,
    memo: 'Adobe Creative Suite 연간 라이센스',
    attachments: ['adobe_invoice.pdf', 'payment_confirmation.jpg']
  },
  {
    id: '3',
    date: '2024-01-05',
    item: '사업 계좌 입금',
    amount: 10000000,
    memo: '고객 선입금',
    attachments: ['bank_statement.jpg']
  }
];

const mockPersonalFunds = [
  {
    id: '1',
    member: { name: '오유택', code: 'OY' },
    date: '2024-01-15',
    item: '교통비 지원',
    amount: 200000,
    memo: '1월 교통비',
    attachments: ['transport_receipt.jpg']
  },
  {
    id: '2',
    member: { name: '이예천', code: 'LE' },
    date: '2024-01-12',
    item: '도서 구입비',
    amount: 150000,
    memo: '디자인 관련 전문서적',
    attachments: ['book_receipt.pdf', 'book_list.jpg']
  }
];

export default function FundsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [companyFunds, setCompanyFunds] = useState(mockCompanyFunds);
  const [personalFunds, setPersonalFunds] = useState(mockPersonalFunds);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isPersonalDialogOpen, setIsPersonalDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // 새 회사 자금 폼 상태
  const [newCompanyFund, setNewCompanyFund] = useState({
    item: '',
    amount: '',
    memo: '',
    attachments: []
  });

  // 새 개인 자금 폼 상태
  const [newPersonalFund, setNewPersonalFund] = useState({
    memberId: '',
    item: '',
    amount: '',
    memo: '',
    attachments: []
  });

  // 파일 업로드 핸들러
  const handleFileUpload = (files, isCompany) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (isCompany) {
      setNewCompanyFund(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles.slice(0, 5 - prev.attachments.length)]
      }));
    } else {
      setNewPersonalFund(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles.slice(0, 5 - prev.attachments.length)]
      }));
    }
  };

  // 파일 제거 핸들러
  const removeFile = (index, isCompany) => {
    if (isCompany) {
      setNewCompanyFund(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    } else {
      setNewPersonalFund(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    }
  };

  // 필터링된 자금 데이터
  const filteredPersonalFunds = useMemo(() => {
    return personalFunds.filter(fund => {
      const matchesSearch = searchTerm === '' ||
        fund.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.memo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMember = memberFilter === '' || fund.member.code === memberFilter;

      return matchesSearch && matchesMember;
    });
  }, [personalFunds, searchTerm, memberFilter]);

  const filteredCompanyFunds = useMemo(() => {
    return companyFunds.filter(fund => {
      const matchesSearch = searchTerm === '' ||
        fund.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.memo.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [companyFunds, searchTerm]);

  // 통계 계산
  const companyStats = useMemo(() => {
    const totalIncome = companyFunds.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
    const totalExpense = companyFunds.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance, count: companyFunds.length };
  }, [companyFunds]);

  const personalStats = useMemo(() => {
    const total = personalFunds.reduce((sum, f) => sum + f.amount, 0);
    const byMember = personalFunds.reduce((acc, f) => {
      acc[f.member.code] = (acc[f.member.code] || 0) + f.amount;
      return acc;
    }, {});

    return { total, byMember, count: personalFunds.length };
  }, [personalFunds]);

  const handleAddCompanyFund = () => {
    if (!newCompanyFund.item || !newCompanyFund.amount) return;

    const fund = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      item: newCompanyFund.item,
      amount: parseInt(newCompanyFund.amount),
      memo: newCompanyFund.memo,
      attachments: newCompanyFund.attachments.map(file => file.name)
    };

    setCompanyFunds([fund, ...companyFunds]);
    setNewCompanyFund({ item: '', amount: '', memo: '', attachments: [] });
    setIsCompanyDialogOpen(false);
  };

  const handleAddPersonalFund = () => {
    if (!newPersonalFund.memberId || !newPersonalFund.item || !newPersonalFund.amount) return;

    const member = mockMembers.find(m => m.id === newPersonalFund.memberId);
    const fund = {
      id: Date.now().toString(),
      member: { name: member.name, code: member.code },
      date: new Date().toISOString().split('T')[0],
      item: newPersonalFund.item,
      amount: parseInt(newPersonalFund.amount),
      memo: newPersonalFund.memo,
      attachments: newPersonalFund.attachments.map(file => file.name)
    };

    setPersonalFunds([fund, ...personalFunds]);
    setNewPersonalFund({ memberId: '', item: '', amount: '', memo: '', attachments: [] });
    setIsPersonalDialogOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return <FileText className="h-4 w-4" />;
    if (['jpg', 'jpeg', 'png'].includes(extension)) return <Image className="h-4 w-4" />;
    return <Paperclip className="h-4 w-4" />;
  };

  return (
    <MainLayout title="자금 관리" subtitle="회사 고정비 및 개인 보조금 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">자금 관리</h1>
            <p className="text-muted-foreground">
              회사 고정비와 개인 보조금을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                회사 수입
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(companyStats.totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                회사 지출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(companyStats.totalExpense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                회사 잔고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${companyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(companyStats.balance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                개인 보조금
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(personalStats.total)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company">회사 자금</TabsTrigger>
            <TabsTrigger value="personal">개인 보조금</TabsTrigger>
          </TabsList>

          {/* 회사 자금 탭 */}
          <TabsContent value="company" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">회사 자금 관리</h3>
                <p className="text-sm text-muted-foreground">
                  사무실 임대료, 소프트웨어 라이센스 등 고정비를 관리하세요
                </p>
              </div>
              <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    회사 자금 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>회사 자금 기록</DialogTitle>
                    <DialogDescription>
                      회사 수입/지출을 기록하고 증빙 파일을 첨부하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="item">항목</Label>
                      <Input
                        id="item"
                        placeholder="예: 사무실 임대료, 소프트웨어 라이센스"
                        value={newCompanyFund.item}
                        onChange={(e) => setNewCompanyFund({...newCompanyFund, item: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">금액 (지출은 음수로 입력)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="예: -2000000 (지출), 10000000 (수입)"
                        value={newCompanyFund.amount}
                        onChange={(e) => setNewCompanyFund({...newCompanyFund, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memo">메모</Label>
                      <Textarea
                        id="memo"
                        placeholder="상세 내용을 입력하세요"
                        value={newCompanyFund.memo}
                        onChange={(e) => setNewCompanyFund({...newCompanyFund, memo: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>증빙 파일 (PDF, JPG, PNG, 최대 5개, 각 10MB)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files, true)}
                          className="hidden"
                          id="company-file-upload"
                        />
                        <label
                          htmlFor="company-file-upload"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">파일을 선택하거나 드래그하세요</span>
                        </label>
                      </div>
                      {newCompanyFund.attachments.length > 0 && (
                        <div className="space-y-2">
                          {newCompanyFund.attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {getFileIcon(file.name)}
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({Math.round(file.size / 1024)} KB)
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index, true)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddCompanyFund} disabled={!newCompanyFund.item || !newCompanyFund.amount}>
                      등록
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 검색 */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="항목, 메모로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 회사 자금 테이블 */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>항목</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>구분</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>첨부파일</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanyFunds.map(fund => (
                      <TableRow key={fund.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {new Date(fund.date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{fund.item}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className={`flex items-center gap-1 ${fund.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {fund.amount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {formatCurrency(fund.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={fund.amount >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {fund.amount >= 0 ? '수입' : '지출'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {fund.memo || '-'}
                        </TableCell>
                        <TableCell>
                          {fund.attachments?.length > 0 && (
                            <Badge variant="outline">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {fund.attachments.length}개
                            </Badge>
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
                                <Eye className="h-4 w-4 mr-2" />
                                보기
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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
          </TabsContent>

          {/* 개인 보조금 탭 */}
          <TabsContent value="personal" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">개인 보조금 관리</h3>
                <p className="text-sm text-muted-foreground">
                  교통비, 도서구입비 등 개인 보조금을 관리하세요
                </p>
              </div>
              <Dialog open={isPersonalDialogOpen} onOpenChange={setIsPersonalDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    보조금 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>개인 보조금 기록</DialogTitle>
                    <DialogDescription>
                      개인 보조금을 기록하고 증빙 파일을 첨부하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">대상자</Label>
                      <Select value={newPersonalFund.memberId} onValueChange={(value) => setNewPersonalFund({...newPersonalFund, memberId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="대상자 선택" />
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
                      <Label htmlFor="item">항목</Label>
                      <Input
                        id="item"
                        placeholder="예: 교통비 지원, 도서구입비"
                        value={newPersonalFund.item}
                        onChange={(e) => setNewPersonalFund({...newPersonalFund, item: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">금액</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="금액을 입력하세요"
                        value={newPersonalFund.amount}
                        onChange={(e) => setNewPersonalFund({...newPersonalFund, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memo">메모</Label>
                      <Textarea
                        id="memo"
                        placeholder="상세 내용을 입력하세요"
                        value={newPersonalFund.memo}
                        onChange={(e) => setNewPersonalFund({...newPersonalFund, memo: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>증빙 파일 (PDF, JPG, PNG, 최대 5개, 각 10MB)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files, false)}
                          className="hidden"
                          id="personal-file-upload"
                        />
                        <label
                          htmlFor="personal-file-upload"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">파일을 선택하거나 드래그하세요</span>
                        </label>
                      </div>
                      {newPersonalFund.attachments.length > 0 && (
                        <div className="space-y-2">
                          {newPersonalFund.attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {getFileIcon(file.name)}
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({Math.round(file.size / 1024)} KB)
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index, false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPersonalDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddPersonalFund} disabled={!newPersonalFund.memberId || !newPersonalFund.item || !newPersonalFund.amount}>
                      등록
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 개인별 보조금 현황 */}
            <Card>
              <CardHeader>
                <CardTitle>개인별 보조금 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {mockMembers.map(member => (
                    <div key={member.id} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold mb-2">
                        {member.code}
                      </div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(personalStats.byMember[member.code] || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 필터 및 검색 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="대상자, 항목, 메모로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="대상자" />
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

            {/* 개인 보조금 테이블 */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>대상자</TableHead>
                      <TableHead>항목</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>첨부파일</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonalFunds.map(fund => (
                      <TableRow key={fund.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {new Date(fund.date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {fund.member.code}
                            </div>
                            <span className="font-medium">{fund.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{fund.item}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-green-600">
                          {formatCurrency(fund.amount)}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {fund.memo || '-'}
                        </TableCell>
                        <TableCell>
                          {fund.attachments?.length > 0 && (
                            <Badge variant="outline">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {fund.attachments.length}개
                            </Badge>
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
                                <Eye className="h-4 w-4 mr-2" />
                                보기
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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

            {filteredPersonalFunds.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">개인 보조금이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    새로운 개인 보조금을 등록해보세요
                  </p>
                  <Button onClick={() => setIsPersonalDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    첫 보조금 등록
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}