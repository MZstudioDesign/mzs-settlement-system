#!/bin/bash
# MZS Settlement System - Comprehensive E2E Test Runner
# 전체 테스트 스위트 실행을 위한 스크립트

set -e

echo "🚀 MZS Settlement System E2E Test Suite"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    print_error "Playwright not found. Please install dependencies first:"
    echo "npm install"
    echo "npx playwright install"
    exit 1
fi

# Check if the development server is running
print_status "Checking if development server is running on port 3001..."
if ! curl -s http://localhost:3001 > /dev/null; then
    print_warning "Development server not running. Starting server..."
    npm run dev &
    SERVER_PID=$!
    print_status "Waiting for server to start..."
    sleep 10

    # Check again
    if ! curl -s http://localhost:3001 > /dev/null; then
        print_error "Failed to start development server"
        exit 1
    fi
    print_success "Development server started"
else
    print_success "Development server is already running"
fi

# Create test results directory
mkdir -p test-results
mkdir -p test-results/screenshots
mkdir -p test-results/videos

print_status "Starting comprehensive E2E test suite..."

# Test execution with different configurations
run_test_suite() {
    local suite_name=$1
    local test_pattern=$2
    local browser=$3

    print_status "Running $suite_name tests on $browser..."

    if npx playwright test "$test_pattern" --project="$browser" --reporter=html; then
        print_success "$suite_name tests passed on $browser"
        return 0
    else
        print_error "$suite_name tests failed on $browser"
        return 1
    fi
}

# Track test results
FAILED_TESTS=()

# Core functionality tests
print_status "=== AUTHENTICATION & NAVIGATION TESTS ==="
if ! run_test_suite "Authentication & Navigation" "tests/auth/authentication.spec.ts" "chromium"; then
    FAILED_TESTS+=("Authentication & Navigation")
fi

print_status "=== DASHBOARD TESTS ==="
if ! run_test_suite "Dashboard" "tests/dashboard/dashboard.spec.ts" "chromium"; then
    FAILED_TESTS+=("Dashboard")
fi

print_status "=== PROJECTS MANAGEMENT TESTS ==="
if ! run_test_suite "Projects Management" "tests/projects/projects-management.spec.ts" "chromium"; then
    FAILED_TESTS+=("Projects Management")
fi

print_status "=== FAB QUICK LOGGER TESTS ==="
if ! run_test_suite "FAB Quick Logger" "tests/fab/fab-quick-logger.spec.ts" "Mobile Chrome"; then
    FAILED_TESTS+=("FAB Quick Logger")
fi

print_status "=== CONTACTS & FEED TESTS ==="
if ! run_test_suite "Contacts & Feed" "tests/contacts-feed/contacts-feed.spec.ts" "chromium"; then
    FAILED_TESTS+=("Contacts & Feed")
fi

print_status "=== SETTLEMENTS TESTS ==="
if ! run_test_suite "Settlements" "tests/settlements/settlements.spec.ts" "chromium"; then
    FAILED_TESTS+=("Settlements")
fi

print_status "=== MOBILE RESPONSIVENESS TESTS ==="
if ! run_test_suite "Mobile Responsiveness" "tests/responsive/mobile-responsive.spec.ts" "Mobile Chrome"; then
    FAILED_TESTS+=("Mobile Responsiveness")
fi

print_status "=== ERROR HANDLING TESTS ==="
if ! run_test_suite "Error Handling" "tests/error-handling/error-edge-cases.spec.ts" "chromium"; then
    FAILED_TESTS+=("Error Handling")
fi

# Cross-browser testing for critical paths
print_status "=== CROSS-BROWSER TESTING ==="
print_status "Running critical tests on Firefox..."
if ! npx playwright test tests/auth/authentication.spec.ts tests/projects/projects-management.spec.ts --project=firefox --reporter=line; then
    FAILED_TESTS+=("Cross-browser Firefox")
fi

print_status "Running critical tests on WebKit..."
if ! npx playwright test tests/auth/authentication.spec.ts tests/dashboard/dashboard.spec.ts --project=webkit --reporter=line; then
    FAILED_TESTS+=("Cross-browser WebKit")
fi

# Mobile-specific testing
print_status "=== MOBILE DEVICE TESTING ==="
if ! npx playwright test tests/fab/fab-quick-logger.spec.ts tests/responsive/mobile-responsive.spec.ts --project="Mobile Safari" --reporter=line; then
    FAILED_TESTS+=("Mobile Safari")
fi

# Performance and accessibility testing
print_status "=== ACCESSIBILITY TESTING ==="
if ! npx playwright test tests/auth/authentication.spec.ts --project=accessibility --reporter=line; then
    FAILED_TESTS+=("Accessibility")
fi

# Generate comprehensive report
print_status "Generating comprehensive test report..."

cat > test-results/summary.md << EOF
# MZS Settlement System E2E Test Results

**Test Execution Date:** $(date)
**Total Test Suites:** 8
**Failed Test Suites:** ${#FAILED_TESTS[@]}

## Test Coverage

### ✅ Core Features Tested
- User Authentication & Session Management
- Dashboard KPI Display & Rankings
- Project CRUD Operations & Designer Assignment
- Mobile FAB Quick Logger with Offline Support
- Contacts & Feed Management
- Settlement Generation & Export
- Mobile Responsiveness & Touch Interactions
- Error Handling & Edge Cases

### 🎯 Test Categories
1. **Functional Testing**: All major user workflows
2. **UI/UX Testing**: Responsive design and mobile interactions
3. **Integration Testing**: API integration and data flow
4. **Performance Testing**: Load times and resource usage
5. **Security Testing**: XSS prevention and input validation
6. **Accessibility Testing**: WCAG compliance and keyboard navigation
7. **Cross-browser Testing**: Chrome, Firefox, Safari compatibility
8. **Mobile Testing**: iOS and Android device simulation

### 📱 Device Coverage
- Desktop: Chrome, Firefox, Safari
- Mobile: iPhone 12, Pixel 5, iPad Pro
- Responsive breakpoints: 320px to 1920px

### 🔍 Test Scenarios
- **Authentication**: Login/logout, session management, protected routes
- **Dashboard**: KPI display, ranking tables, recent activities
- **Projects**: CRUD operations, designer assignment, settlement calculations
- **FAB Logger**: Quick actions, offline support, data synchronization
- **Contacts/Feed**: Data entry, validation, export functionality
- **Settlements**: Monthly generation, PDF/CSV export, payment tracking
- **Mobile UI**: Touch interactions, responsive layouts, navigation
- **Error Cases**: Network failures, server errors, validation errors

EOF

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo "### ❌ Failed Test Suites" >> test-results/summary.md
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo "- $failed_test" >> test-results/summary.md
    done
else
    echo "### 🎉 All Tests Passed!" >> test-results/summary.md
fi

cat >> test-results/summary.md << EOF

### 📊 Detailed Reports
- HTML Report: \`test-results/html-report/index.html\`
- JSON Results: \`test-results/results.json\`
- JUnit XML: \`test-results/results.xml\`

### 📸 Test Artifacts
- Screenshots: \`test-results/screenshots/\`
- Videos: \`test-results/videos/\`
- Traces: \`test-results/traces/\`

## Next Steps
$([ ${#FAILED_TESTS[@]} -gt 0 ] && echo "1. Review failed test logs and screenshots" || echo "1. All tests passed successfully!")
$([ ${#FAILED_TESTS[@]} -gt 0 ] && echo "2. Fix identified issues and re-run tests" || echo "2. Consider expanding test coverage")
$([ ${#FAILED_TESTS[@]} -gt 0 ] && echo "3. Verify fixes don't break existing functionality" || echo "3. Setup CI/CD pipeline integration")

EOF

# Stop development server if we started it
if [ ! -z ${SERVER_PID+x} ]; then
    print_status "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
fi

# Summary
echo ""
echo "======================================="
if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    print_success "🎉 All E2E tests passed successfully!"
    print_status "View detailed report: test-results/html-report/index.html"
    exit 0
else
    print_error "❌ ${#FAILED_TESTS[@]} test suite(s) failed"
    print_status "Failed suites: ${FAILED_TESTS[*]}"
    print_status "View detailed report: test-results/html-report/index.html"
    print_status "Check individual test logs for more details"
    exit 1
fi