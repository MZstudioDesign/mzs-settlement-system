import { defineConfig, devices } from '@playwright/test';

/**
 * MZS 스튜디오 정산 시스템 Playwright E2E 테스트 구성
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* 테스트 실행 시간 제한 */
  timeout: 30 * 1000,
  expect: {
    /* 어설션 타임아웃 */
    timeout: 5000
  },

  /* 병렬 실행 설정 */
  fullyParallel: true,

  /* CI에서 실패 시 재시도 안함, 로컬에서는 1회 재시도 */
  retries: process.env.CI ? 0 : 1,

  /* CI에서는 워커 1개, 로컬에서는 CPU 개수의 절반 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포팅 설정 */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  /* 전역 설정 */
  use: {
    /* 기본 URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3002',

    /* 모든 요청에 대한 추적 설정 */
    trace: 'on-first-retry',

    /* 스크린샷 설정 */
    screenshot: 'only-on-failure',

    /* 비디오 설정 */
    video: 'retain-on-failure',

    /* 접근성 테스트를 위한 설정 */
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
    }
  },

  /* 테스트 전에 개발 서버 시작 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* 다양한 브라우저 환경 설정 */
  projects: [
    /* 데스크톱 브라우저 */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 모바일 브라우저 - 반응형 테스트 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* 태블릿 */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },

    /* 접근성 테스트용 특별 설정 */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // 키보드 네비게이션 테스트를 위한 설정
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
  ],

  /* 테스트 출력 디렉토리 */
  outputDir: 'test-results/',

  /* 전역 설정 파일 */
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
});