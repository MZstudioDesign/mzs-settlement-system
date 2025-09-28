'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function NewProjectDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-new-project">
          <Plus className="mr-2 h-4 w-4" />
          새 프로젝트
        </Button>
      </DialogTrigger>

      <DialogContent
        data-testid="dlg-new-project"
        className="sm:max-w-[560px] z-[100]"
      >
        <DialogHeader>
          <DialogTitle>새 프로젝트 생성</DialogTitle>
          <DialogDescription>기본 정보를 입력하세요.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">프로젝트명</span>
            <Input data-testid="np-name" placeholder="예: 홈페이지 리뉴얼" />
          </label>
          {/* TODO: 추가 필드 */}
        </form>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
          <Button data-testid="np-submit" onClick={() => setOpen(false)}>생성</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}