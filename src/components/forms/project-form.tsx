'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ReactNode } from 'react'
import { Plus, Minus, Calculator } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MoneyInput } from '@/components/ui/money-input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { toKRW, calculateSettlement } from '@/lib/currency'
import type {
  ProjectWithRelations,
  CreateProjectForm,
  UpdateProjectForm,
  DesignerAllocation,
  Member,
  Channel,
  Category,
  ProjectStatus
} from '@/types/database'

// Supporting data interface
interface SupportingData {
  members: Member[]
  channels: Channel[]
  categories: Category[]
}

// Zod validation schema
const projectFormSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요'),
  channel_id: z.string().min(1, '채널을 선택해주세요'),
  category_id: z.string().optional(),
  gross_amount: z.number().positive('총 금액은 0보다 커야 합니다'),
  discount_net: z.number().min(0, '할인 금액은 0 이상이어야 합니다').optional(),
  project_date: z.string().min(1, '프로젝트 날짜를 선택해주세요'),
  payment_date: z.string().optional(),
  notes: z.string().optional(),
  designers: z.array(z.object({
    member_id: z.string().min(1, '멤버를 선택해주세요'),
    percent: z.number().min(0).max(100, '비율은 0-100% 사이여야 합니다'),
    bonus_pct: z.number().min(0).max(20, '보너스는 0-20% 사이여야 합니다')
  })).min(1, '최소 1명의 디자이너를 배정해주세요')
}).refine((data) => {
  // 디자이너 비율 합계가 100%인지 확인
  const totalPercent = data.designers.reduce((sum, designer) => sum + designer.percent, 0)
  return Math.abs(totalPercent - 100) < 0.01 // 부동소수점 오차 고려
}, {
  message: '디자이너 비율의 합계는 100%여야 합니다',
  path: ['designers']
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  initialData?: ProjectWithRelations
  supportingData?: SupportingData
  onSubmit: (data: CreateProjectForm | UpdateProjectForm) => void
  isLoading?: boolean
  submitLabel?: string
  submitIcon?: ReactNode
}

const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-200',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-200',
}

const statusLabels = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
}

export function ProjectForm({
  initialData,
  supportingData,
  onSubmit,
  isLoading = false,
  submitLabel = '저장',
  submitIcon
}: ProjectFormProps) {
  // 초기값 설정
  const defaultValues: ProjectFormValues = {
    name: initialData?.name || '',
    channel_id: initialData?.channel_id || '',
    category_id: initialData?.category_id || '',
    gross_amount: initialData?.gross_amount || 0,
    discount_net: initialData?.discount_net || 0,
    project_date: initialData?.project_date || new Date().toISOString().split('T')[0],
    payment_date: initialData?.payment_date || '',
    notes: initialData?.notes || '',
    designers: initialData?.designers || [{ member_id: '', percent: 100, bonus_pct: 0 }]
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'designers'
  })

  // 폼 제출 핸들러
  const handleFormSubmit = (values: ProjectFormValues) => {
    const formData: CreateProjectForm | UpdateProjectForm = {
      name: values.name,
      channel_id: values.channel_id,
      category_id: values.category_id || undefined,
      gross_amount: values.gross_amount,
      discount_net: values.discount_net || 0,
      project_date: values.project_date,
      payment_date: values.payment_date || undefined,
      notes: values.notes || undefined,
      designers: values.designers.map(d => ({
        member_id: d.member_id,
        percent: d.percent,
        bonus_pct: d.bonus_pct
      }))
    }

    onSubmit(formData)
  }

  // 디자이너 추가/제거
  const addDesigner = () => {
    append({ member_id: '', percent: 0, bonus_pct: 0 })
  }

  const removeDesigner = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  // 비율 자동 분배
  const distributeEvenly = () => {
    const evenPercent = Math.floor(100 / fields.length)
    const remainder = 100 - (evenPercent * fields.length)

    fields.forEach((_, index) => {
      const percent = index === 0 ? evenPercent + remainder : evenPercent
      form.setValue(`designers.${index}.percent`, percent)
    })
  }

  // 현재 값들
  const watchedValues = form.watch()
  const grossAmount = watchedValues.gross_amount || 0
  const discountNet = watchedValues.discount_net || 0
  const designers = watchedValues.designers || []

  // 총 비율 계산
  const totalPercent = designers.reduce((sum, designer) => sum + (designer.percent || 0), 0)
  const isPercentValid = Math.abs(totalPercent - 100) < 0.01

  // 지원 데이터가 없으면 로딩 표시
  if (!supportingData) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="프로젝트명을 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>채널 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="채널 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supportingData.channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name} ({(channel.fee_rate * 100).toFixed(1)}%)
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
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택 (선택사항)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">카테고리 없음</SelectItem>
                    {supportingData.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="프로젝트에 대한 메모를 입력하세요 (선택사항)"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* 금액 및 날짜 정보 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gross_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>총 금액 (VAT 포함) *</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  </FormControl>
                  {field.value > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {toKRW(field.value)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount_net"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>할인 금액 (VAT 제외)</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value || 0}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  </FormControl>
                  {(field.value || 0) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {toKRW(field.value || 0)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="project_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 날짜 *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지급 예정일</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* 디자이너 배분 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">디자이너 배분</h3>
              <p className="text-sm text-muted-foreground">
                프로젝트에 참여할 디자이너들과 배분 비율을 설정하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEvenly}
              >
                <Calculator className="h-4 w-4 mr-2" />
                균등분배
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDesigner}
              >
                <Plus className="h-4 w-4 mr-2" />
                디자이너 추가
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">디자이너 {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDesigner(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`designers.${index}.member_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>멤버 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="멤버 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {supportingData.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name} ({member.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`designers.${index}.percent`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배분 비율 (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`designers.${index}.bonus_pct`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>보너스 (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 개별 정산 미리보기 */}
                {grossAmount > 0 && designers[index]?.member_id && designers[index]?.percent > 0 && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>기본 정산:</span>
                        <span className="font-mono">
                          {toKRW(
                            calculateSettlement(
                              grossAmount,
                              discountNet,
                              designers[index].percent,
                              0
                            ).afterWithholding
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>보너스 포함:</span>
                        <span className="font-mono font-bold">
                          {toKRW(
                            calculateSettlement(
                              grossAmount,
                              discountNet,
                              designers[index].percent,
                              designers[index].bonus_pct
                            ).afterWithholding
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 총 비율 표시 */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="font-medium">총 배분 비율:</span>
            <div className="flex items-center gap-2">
              <Badge
                variant={isPercentValid ? "default" : "destructive"}
                className="font-mono"
              >
                {totalPercent.toFixed(1)}%
              </Badge>
              {!isPercentValid && (
                <span className="text-sm text-destructive">
                  100%가 되어야 합니다
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !isPercentValid}
            className="min-w-32"
          >
            {submitIcon || null}
            {isLoading ? '저장 중...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}