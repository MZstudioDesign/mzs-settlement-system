@echo off
REM ==========================================
REM Fix MZS Settlement System Dev Server
REM ==========================================

REM 0. �۾� ���丮 ����
pushd "D:\��񸸸ӹ���\������Ʈ ������\mzs_sheet\mzs-settlement-system"

echo ���� �۾� ���丮:
cd
echo.

REM 1. Node ���μ��� ����
echo [1/5] Node ���μ��� ���� ...
taskkill /f /im node.exe 2>nul || echo Node ���μ��� ����
echo.

REM 2. .next ĳ�� ����
echo [2/5] .next ���� ...
rmdir /s /q .next 2>nul
echo.

REM 3. node_modules �� package-lock.json ����
echo [3/5] node_modules ���� ...
rmdir /s /q node_modules 2>nul
del /f package-lock.json 2>nul
echo.

REM 4. ��Ű�� �缳ġ
echo [4/5] npm install ���� ...
call npm install
echo.

REM 5. ���� ���� ���� (��Ʈ 9000 ����)
echo [5/5] ���� ���� ���� ...
start cmd /k "npm run dev -- --port=9000"

pause
popd
