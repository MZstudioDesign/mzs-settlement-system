'use client'

import { useState } from 'react'
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
  Settings as SettingsIcon,
  Edit,
  Trash2,
  Save,
  Users,
  DollarSign,
  Palette,
  Shield,
  Database,
  MoreHorizontal,
  Lock,
  Key,
  Percent,
  Tag,
  Building,
  Eye,
  EyeOff
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
const mockSettings = {
  fees: {
    designerRate: 0.40,
    adRate: 0.10,
    programRate: 0.03,
    withholdingRate: 0.033,
    contactRates: {
      INCOMING: 1000,
      CHAT: 1000,
      GUIDE: 2000
    },
    feedRates: {
      BELOW3: 400,
      GTE3: 1000
    }
  },
  branding: {
    companyName: 'MZS 스튜디오',
    primaryColor: '#f68b1f',
    logoUrl: '',
    description: '디자인 전문 스튜디오'
  },
  security: {
    passwordChangeRequired: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  }
};

const mockMembers = [
  { id: '1', name: '오유택', code: 'OY', position: '대표', active: true, joinDate: '2023-01-01' },
  { id: '2', name: '이예천', code: 'LE', position: '시니어 디자이너', active: true, joinDate: '2023-03-15' },
  { id: '3', name: '김연지', code: 'KY', position: '디자이너', active: true, joinDate: '2023-06-01' },
  { id: '4', name: '김하늘', code: 'KH', position: '디자이너', active: true, joinDate: '2023-08-20' },
  { id: '5', name: '이정수', code: 'IJ', position: '주니어 디자이너', active: true, joinDate: '2023-10-01' },
  { id: '6', name: '박지윤', code: 'PJ', position: '인턴 디자이너', active: false, joinDate: '2023-11-15' }
];

const mockChannels = [
  { id: '1', name: '크몽', adRate: 0.10, programRate: 0.03, marketFeeRate: 0.21, feeBase: 'B', active: true },
  { id: '2', name: '계좌입금', adRate: 0.10, programRate: 0.03, marketFeeRate: 0, feeBase: 'B', active: true },
  { id: '3', name: '당근마켓', adRate: 0.10, programRate: 0.03, marketFeeRate: 0.15, feeBase: 'B', active: false }
];

const mockCategories = [
  { id: '1', code: 'CARD', name: '카드뉴스', active: true },
  { id: '2', code: 'POSTER', name: '포스터', active: true },
  { id: '3', code: 'BANNER', name: '현수막/배너', active: true },
  { id: '4', code: 'MENU', name: '메뉴판', active: true },
  { id: '5', code: 'BLOG', name: '블로그스킨', active: false }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('fees');
  const [settings, setSettings] = useState(mockSettings);
  const [members, setMembers] = useState(mockMembers);
  const [channels, setChannels] = useState(mockChannels);
  const [categories, setCategories] = useState(mockCategories);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);

  // Dialog states
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Form states
  const [newMember, setNewMember] = useState({ name: '', code: '', position: '' });
  const [newChannel, setNewChannel] = useState({ name: '', adRate: 0.10, programRate: 0.03, marketFeeRate: 0, feeBase: 'B' });
  const [newCategory, setNewCategory] = useState({ code: '', name: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSettingChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setIsUnsaved(true);
  };

  const handleSaveSettings = () => {
    // 실제로는 API 호출
    console.log('Saving settings:', settings);
    setIsUnsaved(false);
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.code) return;

    const member = {
      id: Date.now().toString(),
      ...newMember,
      active: true,
      joinDate: new Date().toISOString().split('T')[0]
    };

    setMembers([...members, member]);
    setNewMember({ name: '', code: '', position: '' });
    setIsMemberDialogOpen(false);
  };

  const handleAddChannel = () => {
    if (!newChannel.name) return;

    const channel = {
      id: Date.now().toString(),
      ...newChannel,
      active: true
    };

    setChannels([...channels, channel]);
    setNewChannel({ name: '', adRate: 0.10, programRate: 0.03, marketFeeRate: 0, feeBase: 'B' });
    setIsChannelDialogOpen(false);
  };

  const handleAddCategory = () => {
    if (!newCategory.code || !newCategory.name) return;

    const category = {
      id: Date.now().toString(),
      ...newCategory,
      active: true
    };

    setCategories([...categories, category]);
    setNewCategory({ code: '', name: '' });
    setIsCategoryDialogOpen(false);
  };

  const handleToggleActive = (type, id) => {
    switch (type) {
      case 'member':
        setMembers(members.map(m => m.id === id ? { ...m, active: !m.active } : m));
        break;
      case 'channel':
        setChannels(channels.map(c => c.id === id ? { ...c, active: !c.active } : c));
        break;
      case 'category':
        setCategories(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
        break;
    }
  };

  const handleDeleteItem = (type, id) => {
    switch (type) {
      case 'member':
        setMembers(members.filter(m => m.id !== id));
        break;
      case 'channel':
        setChannels(channels.filter(c => c.id !== id));
        break;
      case 'category':
        setCategories(categories.filter(c => c.id !== id));
        break;
    }
  };

  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    // 실제로는 API 호출
    console.log('Changing password');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordDialogOpen(false);
  };

  const formatRate = (rate) => (rate * 100).toFixed(1) + '%';

  return (
    <MainLayout title="설정" subtitle="시스템 설정 및 관리">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">시스템 설정</h1>
            <p className="text-muted-foreground">
              정산 규칙, 브랜딩, 보안 등 시스템 설정을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            {isUnsaved && (
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" />
                변경사항 저장
              </Button>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fees">정산 규칙</TabsTrigger>
            <TabsTrigger value="members">멤버 관리</TabsTrigger>
            <TabsTrigger value="channels">채널 관리</TabsTrigger>
            <TabsTrigger value="categories">카테고리</TabsTrigger>
            <TabsTrigger value="branding">브랜딩</TabsTrigger>
          </TabsList>

          {/* 정산 규칙 탭 */}
          <TabsContent value="fees" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정산 규칙 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    기본 정산 규칙
                  </CardTitle>
                  <CardDescription>
                    전체 정산에 적용되는 기본 규칙을 설정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="designerRate">디자이너 분배율</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="designerRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings.fees.designerRate}
                        onChange={(e) => handleSettingChange('fees.designerRate', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">({formatRate(settings.fees.designerRate)})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adRate">광고 수수료율</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="adRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings.fees.adRate}
                        onChange={(e) => handleSettingChange('fees.adRate', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">({formatRate(settings.fees.adRate)})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programRate">프로그램 수수료율</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="programRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings.fees.programRate}
                        onChange={(e) => handleSettingChange('fees.programRate', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">({formatRate(settings.fees.programRate)})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withholdingRate">원천징수율</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="withholdingRate"
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={settings.fees.withholdingRate}
                        onChange={(e) => handleSettingChange('fees.withholdingRate', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">({formatRate(settings.fees.withholdingRate)})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 컨택 및 피드 단가 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    컨택 및 피드 단가
                  </CardTitle>
                  <CardDescription>
                    컨택 이벤트와 피드 활동의 단가를 설정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">컨택 이벤트 단가</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="incomingRate" className="text-sm">유입 (INCOMING)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="incomingRate"
                            type="number"
                            min="0"
                            value={settings.fees.contactRates.INCOMING}
                            onChange={(e) => handleSettingChange('fees.contactRates.INCOMING', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="chatRate" className="text-sm">상담 (CHAT)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="chatRate"
                            type="number"
                            min="0"
                            value={settings.fees.contactRates.CHAT}
                            onChange={(e) => handleSettingChange('fees.contactRates.CHAT', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="guideRate" className="text-sm">가이드 (GUIDE)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="guideRate"
                            type="number"
                            min="0"
                            value={settings.fees.contactRates.GUIDE}
                            onChange={(e) => handleSettingChange('fees.contactRates.GUIDE', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">피드 활동 단가</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="below3Rate" className="text-sm">3개 미만 (BELOW3)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="below3Rate"
                            type="number"
                            min="0"
                            value={settings.fees.feedRates.BELOW3}
                            onChange={(e) => handleSettingChange('fees.feedRates.BELOW3', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gte3Rate" className="text-sm">3개 이상 (GTE3)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="gte3Rate"
                            type="number"
                            min="0"
                            value={settings.fees.feedRates.GTE3}
                            onChange={(e) => handleSettingChange('fees.feedRates.GTE3', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 멤버 관리 탭 */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">멤버 관리</h3>
                <p className="text-sm text-muted-foreground">
                  팀원 정보를 관리하고 활성화 상태를 제어하세요
                </p>
              </div>
              <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    멤버 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 멤버 추가</DialogTitle>
                    <DialogDescription>
                      새로운 팀원을 추가하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">이름</Label>
                      <Input
                        id="memberName"
                        placeholder="이름을 입력하세요"
                        value={newMember.name}
                        onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberCode">코드</Label>
                      <Input
                        id="memberCode"
                        placeholder="예: OY, LE"
                        value={newMember.code}
                        onChange={(e) => setNewMember({...newMember, code: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="memberPosition">직급</Label>
                      <Input
                        id="memberPosition"
                        placeholder="예: 디자이너, 시니어 디자이너"
                        value={newMember.position}
                        onChange={(e) => setNewMember({...newMember, position: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddMember} disabled={!newMember.name || !newMember.code}>
                      추가
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>코드</TableHead>
                      <TableHead>직급</TableHead>
                      <TableHead>입사일</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {member.code}
                            </div>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.code}</Badge>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(member.joinDate).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={member.active}
                            onCheckedChange={() => handleToggleActive('member', member.id)}
                          />
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
                                onClick={() => handleDeleteItem('member', member.id)}
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
          </TabsContent>

          {/* 채널 관리 탭 */}
          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">채널 관리</h3>
                <p className="text-sm text-muted-foreground">
                  판매 채널을 관리하고 각 채널별 수수료율을 설정하세요
                </p>
              </div>
              <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    채널 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 채널 추가</DialogTitle>
                    <DialogDescription>
                      새로운 판매 채널을 추가하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="channelName">채널명</Label>
                      <Input
                        id="channelName"
                        placeholder="예: 크몽, 숨고"
                        value={newChannel.name}
                        onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channelMarketFee">채널 수수료율</Label>
                      <Input
                        id="channelMarketFee"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.21 (21%)"
                        value={newChannel.marketFeeRate}
                        onChange={(e) => setNewChannel({...newChannel, marketFeeRate: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChannelDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddChannel} disabled={!newChannel.name}>
                      추가
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>채널명</TableHead>
                      <TableHead>광고 수수료</TableHead>
                      <TableHead>프로그램 수수료</TableHead>
                      <TableHead>채널 수수료</TableHead>
                      <TableHead>수수료 기준</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map(channel => (
                      <TableRow key={channel.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{channel.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatRate(channel.adRate)}</TableCell>
                        <TableCell>{formatRate(channel.programRate)}</TableCell>
                        <TableCell>{formatRate(channel.marketFeeRate)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{channel.feeBase}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={channel.active}
                            onCheckedChange={() => handleToggleActive('channel', channel.id)}
                          />
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
                                onClick={() => handleDeleteItem('channel', channel.id)}
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
          </TabsContent>

          {/* 카테고리 탭 */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">카테고리 관리</h3>
                <p className="text-sm text-muted-foreground">
                  프로젝트 카테고리를 관리하세요
                </p>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    카테고리 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>새 카테고리 추가</DialogTitle>
                    <DialogDescription>
                      새로운 프로젝트 카테고리를 추가하세요
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryCode">코드</Label>
                      <Input
                        id="categoryCode"
                        placeholder="예: LOGO, BROCHURE"
                        value={newCategory.code}
                        onChange={(e) => setNewCategory({...newCategory, code: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">이름</Label>
                      <Input
                        id="categoryName"
                        placeholder="예: 로고 디자인, 브로슈어"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddCategory} disabled={!newCategory.code || !newCategory.name}>
                      추가
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>코드</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>활성화</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => (
                      <TableRow key={category.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="secondary">{category.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={category.active}
                            onCheckedChange={() => handleToggleActive('category', category.id)}
                          />
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
                                onClick={() => handleDeleteItem('category', category.id)}
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
          </TabsContent>

          {/* 브랜딩 탭 */}
          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 회사 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    회사 정보
                  </CardTitle>
                  <CardDescription>
                    회사명과 기본 정보를 설정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">회사명</Label>
                    <Input
                      id="companyName"
                      value={settings.branding.companyName}
                      onChange={(e) => handleSettingChange('branding.companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={settings.branding.description}
                      onChange={(e) => handleSettingChange('branding.description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 브랜딩 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    브랜딩
                  </CardTitle>
                  <CardDescription>
                    로고와 브랜드 컬러를 설정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">주요 색상</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={(e) => handleSettingChange('branding.primaryColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={settings.branding.primaryColor}
                        onChange={(e) => handleSettingChange('branding.primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">로고 URL</Label>
                    <Input
                      id="logoUrl"
                      placeholder="로고 이미지 URL을 입력하세요"
                      value={settings.branding.logoUrl}
                      onChange={(e) => handleSettingChange('branding.logoUrl', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 보안 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    보안 설정
                  </CardTitle>
                  <CardDescription>
                    시스템 보안 설정을 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>비밀번호 변경 강제</Label>
                      <p className="text-sm text-muted-foreground">
                        정기적으로 비밀번호 변경을 요구합니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.passwordChangeRequired}
                      onCheckedChange={(checked) => handleSettingChange('security.passwordChangeRequired', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">세션 만료 시간 (분)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="480"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security.sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>비밀번호 변경</Label>
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Key className="h-4 w-4 mr-2" />
                          비밀번호 변경
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>비밀번호 변경</DialogTitle>
                          <DialogDescription>
                            새로운 비밀번호로 변경하세요
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">현재 비밀번호</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">새 비밀번호</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                            취소
                          </Button>
                          <Button
                            onClick={handlePasswordChange}
                            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                          >
                            변경
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}