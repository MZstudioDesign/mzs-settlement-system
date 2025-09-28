@echo off
REM ================================
REM Reset Script (no npm install, no server start)
REM ================================

REM 0. 작업 디렉토리 고정
cd /d "D:\잠깐만머물께\웹사이트 디자인\mzs_sheet\mzs-settlement-system"

REM 1. Node 프로세스 종료
echo [1] Node 프로세스 종료...
taskkill /f /im node.exe 2>nul || echo Node 없음
echo.

REM 2. .next 캐시 삭제
echo [2] .next 캐시 삭제...
rmdir /s /q .next 2>nul
echo.

echo 리셋 완료! 이제 VSCode나 Claude Code에서 직접 실행하세요:
echo    npm run dev -- --port=9000

pause
