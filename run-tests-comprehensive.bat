@echo off
REM MZS Settlement System - Comprehensive E2E Test Runner (Windows)
REM 전체 테스트 스위트 실행을 위한 Windows 배치 파일

echo =======================================
echo 🚀 MZS Settlement System E2E Test Suite
echo =======================================

REM Check if Playwright is available
where npx >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js/npm not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if development server is running
echo [INFO] Checking if development server is running on port 3001...
curl -s http://localhost:3001 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Development server not running. Starting server...
    start /b npm run dev
    echo [INFO] Waiting for server to start...
    timeout /t 10 /nobreak >nul

    REM Check again
    curl -s http://localhost:3001 >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to start development server
        pause
        exit /b 1
    )
    echo [SUCCESS] Development server started
) else (
    echo [SUCCESS] Development server is already running
)

REM Create test results directory
if not exist "test-results" mkdir "test-results"
if not exist "test-results\screenshots" mkdir "test-results\screenshots"
if not exist "test-results\videos" mkdir "test-results\videos"

echo [INFO] Starting comprehensive E2E test suite...

set FAILED_TESTS=0

echo.
echo === AUTHENTICATION ^& NAVIGATION TESTS ===
echo [INFO] Running Authentication ^& Navigation tests...
call npx playwright test tests/auth/authentication.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Authentication ^& Navigation tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Authentication ^& Navigation tests passed
)

echo.
echo === DASHBOARD TESTS ===
echo [INFO] Running Dashboard tests...
call npx playwright test tests/dashboard/dashboard.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Dashboard tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Dashboard tests passed
)

echo.
echo === PROJECTS MANAGEMENT TESTS ===
echo [INFO] Running Projects Management tests...
call npx playwright test tests/projects/projects-management.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Projects Management tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Projects Management tests passed
)

echo.
echo === FAB QUICK LOGGER TESTS ===
echo [INFO] Running FAB Quick Logger tests...
call npx playwright test tests/fab/fab-quick-logger.spec.ts --project="Mobile Chrome" --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] FAB Quick Logger tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] FAB Quick Logger tests passed
)

echo.
echo === CONTACTS ^& FEED TESTS ===
echo [INFO] Running Contacts ^& Feed tests...
call npx playwright test tests/contacts-feed/contacts-feed.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Contacts ^& Feed tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Contacts ^& Feed tests passed
)

echo.
echo === SETTLEMENTS TESTS ===
echo [INFO] Running Settlements tests...
call npx playwright test tests/settlements/settlements.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Settlements tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Settlements tests passed
)

echo.
echo === MOBILE RESPONSIVENESS TESTS ===
echo [INFO] Running Mobile Responsiveness tests...
call npx playwright test tests/responsive/mobile-responsive.spec.ts --project="Mobile Chrome" --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Mobile Responsiveness tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Mobile Responsiveness tests passed
)

echo.
echo === ERROR HANDLING TESTS ===
echo [INFO] Running Error Handling tests...
call npx playwright test tests/error-handling/error-edge-cases.spec.ts --project=chromium --reporter=html
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error Handling tests failed
    set /a FAILED_TESTS+=1
) else (
    echo [SUCCESS] Error Handling tests passed
)

echo.
echo === CROSS-BROWSER TESTING ===
echo [INFO] Running critical tests on Firefox...
call npx playwright test tests/auth/authentication.spec.ts tests/projects/projects-management.spec.ts --project=firefox --reporter=line
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some Firefox tests failed
    set /a FAILED_TESTS+=1
)

echo [INFO] Running critical tests on WebKit...
call npx playwright test tests/auth/authentication.spec.ts tests/dashboard/dashboard.spec.ts --project=webkit --reporter=line
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some WebKit tests failed
    set /a FAILED_TESTS+=1
)

echo.
echo === MOBILE DEVICE TESTING ===
echo [INFO] Running mobile-specific tests...
call npx playwright test tests/fab/fab-quick-logger.spec.ts tests/responsive/mobile-responsive.spec.ts --project="Mobile Safari" --reporter=line
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Mobile Safari tests failed
    set /a FAILED_TESTS+=1
)

echo.
echo [INFO] Generating test summary...

REM Generate test summary
echo # MZS Settlement System E2E Test Results > test-results\summary.md
echo. >> test-results\summary.md
echo **Test Execution Date:** %DATE% %TIME% >> test-results\summary.md
echo **Total Test Suites:** 8 >> test-results\summary.md
echo **Failed Test Suites:** %FAILED_TESTS% >> test-results\summary.md
echo. >> test-results\summary.md
echo ## Test Coverage >> test-results\summary.md
echo. >> test-results\summary.md
echo ### ✅ Core Features Tested >> test-results\summary.md
echo - User Authentication ^& Session Management >> test-results\summary.md
echo - Dashboard KPI Display ^& Rankings >> test-results\summary.md
echo - Project CRUD Operations ^& Designer Assignment >> test-results\summary.md
echo - Mobile FAB Quick Logger with Offline Support >> test-results\summary.md
echo - Contacts ^& Feed Management >> test-results\summary.md
echo - Settlement Generation ^& Export >> test-results\summary.md
echo - Mobile Responsiveness ^& Touch Interactions >> test-results\summary.md
echo - Error Handling ^& Edge Cases >> test-results\summary.md
echo. >> test-results\summary.md
echo ### 📊 Detailed Reports >> test-results\summary.md
echo - HTML Report: `test-results/html-report/index.html` >> test-results\summary.md
echo - JSON Results: `test-results/results.json` >> test-results\summary.md
echo - JUnit XML: `test-results/results.xml` >> test-results\summary.md

echo.
echo =======================================
if %FAILED_TESTS% equ 0 (
    echo [SUCCESS] 🎉 All E2E tests completed successfully!
    echo [INFO] View detailed report: test-results\html-report\index.html
) else (
    echo [ERROR] ❌ %FAILED_TESTS% test suite^(s^) had issues
    echo [INFO] View detailed report: test-results\html-report\index.html
    echo [INFO] Check individual test logs for more details
)

echo.
echo Press any key to open test report...
pause >nul

REM Try to open HTML report
if exist "test-results\html-report\index.html" (
    start "" "test-results\html-report\index.html"
) else (
    echo Test report not found. Run tests first.
)

if %FAILED_TESTS% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)