@echo off
REM ================================
REM Reset Script (no npm install, no server start)
REM ================================

REM 0. �۾� ���丮 ����
cd /d "D:\��񸸸ӹ���\������Ʈ ������\mzs_sheet\mzs-settlement-system"

REM 1. Node ���μ��� ����
echo [1] Node ���μ��� ����...
taskkill /f /im node.exe 2>nul || echo Node ����
echo.

REM 2. .next ĳ�� ����
echo [2] .next ĳ�� ����...
rmdir /s /q .next 2>nul
echo.

echo ���� �Ϸ�! ���� VSCode�� Claude Code���� ���� �����ϼ���:
echo    npm run dev -- --port=9000

pause
