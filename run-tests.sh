#!/bin/bash

echo "🚀 MZS 정산 시스템 E2E 테스트 실행기"
echo

echo "📋 사전 요구사항 확인..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    exit 1
fi

echo "✅ Node.js 설치 확인됨"

echo
echo "📦 의존성 설치 확인..."
if [ ! -d "node_modules" ]; then
    echo "📥 패키지 설치 중..."
    npm install
fi

echo
echo "🎭 Playwright 브라우저 설치 확인..."
npx playwright install

echo
echo "🌐 개발 서버 시작 확인..."
echo "개발 서버가 http://localhost:3001에서 실행 중인지 확인하세요."
echo "실행 중이 아니라면 새 터미널에서 'npm run dev' 명령을 실행하세요."
echo

read -p "개발 서버가 실행 중입니까? (y/n): " choice
if [[ $choice != [Yy] ]]; then
    echo "개발 서버를 먼저 시작한 후 다시 실행해주세요."
    exit 1
fi

echo
echo "🧪 테스트 실행 옵션을 선택하세요:"
echo "1. 모든 테스트 실행 (헤드리스)"
echo "2. UI 모드로 테스트 실행"
echo "3. 브라우저를 보면서 테스트 실행"
echo "4. 특정 테스트 파일만 실행"
echo "5. 모바일 테스트만 실행"
echo "6. 접근성 테스트만 실행"
echo

read -p "옵션을 선택하세요 (1-6): " option

case $option in
    1)
        echo "📊 모든 테스트 실행 중..."
        npm run test:e2e
        ;;
    2)
        echo "🎨 UI 모드로 테스트 실행 중..."
        npm run test:e2e:ui
        ;;
    3)
        echo "👀 브라우저를 보면서 테스트 실행 중..."
        npm run test:e2e:headed
        ;;
    4)
        echo
        echo "사용 가능한 테스트 파일:"
        echo "1. 01-homepage.spec.ts (홈페이지)"
        echo "2. 02-projects-crud.spec.ts (프로젝트 CRUD)"
        echo "3. 03-settlement-calculator.spec.ts (정산 계산)"
        echo "4. 04-responsive-mobile.spec.ts (모바일 반응형)"
        echo "5. 05-accessibility.spec.ts (접근성)"
        echo

        read -p "실행할 테스트 번호를 선택하세요 (1-5): " testfile

        case $testfile in
            1) npx playwright test 01-homepage.spec.ts ;;
            2) npx playwright test 02-projects-crud.spec.ts ;;
            3) npx playwright test 03-settlement-calculator.spec.ts ;;
            4) npx playwright test 04-responsive-mobile.spec.ts ;;
            5) npx playwright test 05-accessibility.spec.ts ;;
            *) echo "잘못된 선택입니다."; exit 1 ;;
        esac
        ;;
    5)
        echo "📱 모바일 테스트 실행 중..."
        npx playwright test --project="Mobile Chrome"
        ;;
    6)
        echo "♿ 접근성 테스트 실행 중..."
        npx playwright test 05-accessibility.spec.ts
        ;;
    *)
        echo "잘못된 옵션입니다."
        exit 1
        ;;
esac

echo
echo "📋 테스트 완료! 결과를 확인하려면 다음 명령을 실행하세요:"
echo "npm run test:e2e:report"
echo