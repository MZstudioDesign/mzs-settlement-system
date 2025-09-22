'use client'

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Calendar,
  Users,
  DollarSign,
  SortAsc,
  SortDesc
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  clientName: string;
  category: string;
  totalAmount: number;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  assignedDesigners: string[];
  progress: number; // 진행률 (0-100)
  createdAt: string;
  tags?: string[];
}

interface ProjectListTableProps {
  projects: Project[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  planning: { label: '기획', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: '진행중', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  review: { label: '검토', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '완료', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  cancelled: { label: '취소', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
};

const CATEGORY_LABELS = {
  'brand-identity': '브랜드 아이덴티티',
  'web-design': '웹 디자인',
  'app-design': '앱 디자인',
  'print-design': '인쇄 디자인',
  'package-design': '패키지 디자인',
  'marketing-design': '마케팅 디자인',
  'illustration': '일러스트레이션',
  'other': '기타'
};

type SortField = 'name' | 'clientName' | 'totalAmount' | 'startDate' | 'status';
type SortDirection = 'asc' | 'desc';

export function ProjectListTable({
  projects,
  onView,
  onEdit,
  onDownload,
  onDelete,
  isLoading = false
}: ProjectListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 필터링
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 정렬
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'totalAmount') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === 'startDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'cancelled') return 'bg-gray-400';
    if (progress >= 80) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4 ml-1" />
    ) : (
      <SortDesc className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>프로젝트 목록</span>
              <Badge variant="outline">{sortedProjects.length}개</Badge>
            </CardTitle>
            <CardDescription>
              진행중인 프로젝트와 완료된 프로젝트를 관리하세요.
            </CardDescription>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트명, 클라이언트명, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    프로젝트명
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    클라이언트
                    <SortIcon field="clientName" />
                  </div>
                </TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center justify-end">
                    금액
                    <SortIcon field="totalAmount" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    상태
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead>진행률</TableHead>
                <TableHead>팀원</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center">
                    시작일
                    <SortIcon field="startDate" />
                  </div>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // 로딩 스켈레톤
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? '검색 조건에 맞는 프로젝트가 없습니다.'
                      : '등록된 프로젝트가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((project) => {
                  const statusConfig = STATUS_CONFIG[project.status];
                  const categoryLabel = CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] || project.category;

                  return (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium truncate max-w-48">{project.name}</p>
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="truncate max-w-32">{project.clientName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {formatCurrency(project.totalAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                getProgressColor(project.progress, project.status)
                              )}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{project.assignedDesigners.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.startDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(project.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                상세보기
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(project.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                수정하기
                              </DropdownMenuItem>
                            )}
                            {onDownload && (
                              <DropdownMenuItem onClick={() => onDownload(project.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                다운로드
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}