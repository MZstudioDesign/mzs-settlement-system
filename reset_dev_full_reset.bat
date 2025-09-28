@echo off
REM ==========================================
REM Fix MZS Settlement System Dev Server
REM ==========================================

REM 0. 작업 디렉토리 고정
pushd "D:\잠깐만머물께\웹사이트 디자인\mzs_sheet\mzs-settlement-system"

echo 현재 작업 디렉토리:
cd
echo.

REM 1. Node 프로세스 종료
echo [1/5] Node 프로세스 종료 ...
taskkill /f /im node.exe 2>nul || echo Node 프로세스 없음
echo.

REM 2. .next 캐시 삭제
echo [2/5] .next 삭제 ...
rmdir /s /q .next 2>nul
echo.

REM 3. node_modules 및 package-lock.json 삭제
echo [3/5] node_modules 삭제 ...
rmdir /s /q node_modules 2>nul
del /f package-lock.json 2>nul
echo.

REM 4. 패키지 재설치
echo [4/5] npm install 실행 ...
call npm install
echo.

REM 5. 개발 서버 실행 (포트 9000 고정)
echo [5/5] 개발 서버 실행 ...
start cmd /k "npm run dev -- --port=9000"

pause
popd
