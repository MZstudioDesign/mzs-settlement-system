// tests/e2e/ui-core.spec.ts
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:9000'

test.describe('Desktop 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Centered layout, no bottom-nav, New Project dialog visible', async ({ page }) => {
    await page.goto(BASE)

    // 1) 데스크톱에서 하단 네비가 없어야 함
    await expect(page.locator('[data-testid="bottom-nav"]')).toHaveCount(0)

    // 2) KPI-3 보임(사용자 요청 사항)
    await expect(page.getByTestId('kpi-3')).toBeVisible()

    // 3) 새 프로젝트 모달 실제 DOM 가시성 (이게 최종 확정 포인트)
    await page.getByTestId('btn-new-project').click()
    const dlg = page.locator('[data-testid="dlg-new-project"], [role="dialog"][data-state="open"]')
    await expect(dlg).toBeVisible()
  })
})

test.describe('Mobile 375x812', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Bottom-nav visible & nav works; Contact buttons accumulate', async ({ page }) => {
    await page.goto(BASE)

    // 모바일에서 하단 네비가 보여야 함
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()

    // 오버레이/장식 레이어가 클릭 막지 않는지 검증: 프로젝트
    await page.locator('[data-testid="bottom-nav"] a[href="/projects"]').click()
    await expect(page).toHaveURL(/\/projects$/)

    // 정산 페이지: 과거 타임아웃 원인 재검증
    await page.locator('[data-testid="bottom-nav"] a[href="/settlements"]').click()
    await expect(page).toHaveURL(/\/settlements$/)

    // 컨택 플로우
    await page.goto(`${BASE}/contacts`)

    // (선택) 멤버 선택 로직이 있다면 data-testid로 조작
    // await page.getByTestId('member-select').click()
    // await page.locator('[role="option"]').first().click()

    for (let i=0;i<3;i++) await page.getByTestId('btn-contact-incoming').click()
    for (let i=0;i<2;i++) await page.getByTestId('btn-contact-chat').click()
    for (let i=0;i<2;i++) await page.getByTestId('btn-contact-guide').click()

    await expect(page.getByTestId('contact-total-count')).toHaveText('7')
    await expect(page.getByTestId('contact-total-amount')).toContainText('9,000')
  })
})