#!/bin/bash

# Yuletide Backend - Dependency Validation Script
# Checks all required dependencies before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Yuletide Backend - Dependency Validation"
echo "========================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command availability
check_command() {
    local cmd=$1
    local name=$2
    local required=$3

    if command -v "$cmd" &> /dev/null; then
        version=$($cmd --version 2>&1 | head -n 1)
        echo -e "${GREEN}✓${NC} $name: $version"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗${NC} $name: NOT FOUND (REQUIRED)"
            ERRORS=$((ERRORS + 1))
            return 1
        else
            echo -e "${YELLOW}⚠${NC} $name: NOT FOUND (Optional)"
            WARNINGS=$((WARNINGS + 1))
            return 1
        fi
    fi
}

# Function to check Node version
check_node_version() {
    if command -v node &> /dev/null; then
        version=$(node --version | sed 's/v//')
        major=$(echo $version | cut -d. -f1)

        if [ "$major" -ge 16 ]; then
            echo -e "${GREEN}✓${NC} Node.js: v$version (>= 16.0.0 required)"
            return 0
        else
            echo -e "${RED}✗${NC} Node.js: v$version (< 16.0.0 - TOO OLD)"
            ERRORS=$((ERRORS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Node.js: NOT FOUND"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check Python version
check_python() {
    if command -v python3 &> /dev/null; then
        version=$(python3 --version 2>&1)
        echo -e "${GREEN}✓${NC} Python3: $version"
        return 0
    elif command -v python &> /dev/null; then
        version=$(python --version 2>&1)
        if [[ $version == *"Python 3"* ]]; then
            echo -e "${GREEN}✓${NC} Python: $version"
            return 0
        else
            echo -e "${RED}✗${NC} Python: $version (Python 3.x required)"
            ERRORS=$((ERRORS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Python: NOT FOUND (Required for node-gyp)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "Checking Runtime Dependencies..."
echo "================================"
check_node_version
check_command "npm" "NPM" "true"
echo ""

echo "Checking Build Dependencies..."
echo "=============================="
check_python
check_command "gcc" "GCC (C Compiler)" "true" || check_command "clang" "Clang (C Compiler)" "true"
check_command "make" "Make" "true"
check_command "g++" "G++ (C++ Compiler)" "false"
echo ""

echo "Checking Platform-Specific..."
echo "============================="
check_command "git" "Git" "false"
check_command "docker" "Docker" "false"
check_command "railway" "Railway CLI" "false"
echo ""

# Check for project files
echo "Checking Project Configuration..."
echo "=================================="

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "nixpacks.toml" ]; then
    echo -e "${GREEN}✓${NC} nixpacks.toml found (Railway config)"

    # Check for required packages
    if grep -q "python3" nixpacks.toml && \
       grep -q "gcc" nixpacks.toml && \
       grep -q "gnumake" nixpacks.toml; then
        echo -e "${GREEN}✓${NC} nixpacks.toml has all required build dependencies"
    else
        echo -e "${YELLOW}⚠${NC} nixpacks.toml may be missing build dependencies"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} nixpacks.toml NOT FOUND (Required for Railway deployment)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "server.js" ]; then
    echo -e "${GREEN}✓${NC} server.js found"

    # Check if server binds to 0.0.0.0
    if grep -q "0.0.0.0" server.js; then
        echo -e "${GREEN}✓${NC} Server configured to bind to 0.0.0.0 (cloud-compatible)"
    else
        echo -e "${YELLOW}⚠${NC} Server may not bind to 0.0.0.0 (check cloud compatibility)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} server.js NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test npm install if requested
if [ "$1" = "--test-install" ]; then
    echo "Testing npm install..."
    echo "====================="
    if npm ci --dry-run 2>&1 | grep -q "better-sqlite3"; then
        echo -e "${GREEN}✓${NC} better-sqlite3 will be installed"
        echo -e "${YELLOW}⚠${NC} Note: better-sqlite3 requires compilation"
    fi
fi

# Summary
echo ""
echo "========================================="
echo "Validation Summary"
echo "========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo "System is ready for deployment!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS WARNING(S)${NC}"
    echo "System should work but check warnings above."
    exit 0
else
    echo -e "${RED}✗ $ERRORS ERROR(S), $WARNINGS WARNING(S)${NC}"
    echo ""
    echo "Fix the errors above before deploying."
    echo "See INFRASTRUCTURE.md for solutions."
    exit 1
fi
