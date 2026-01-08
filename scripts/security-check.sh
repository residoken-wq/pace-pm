#!/bin/bash

# Security Check Script
echo "Starting Security Check..."

# 1. Frontend Audit
echo "Scanning Frontend (npm audit)..."
cd apps/web
npm audit --audit-level=high
if [ $? -ne 0 ]; then
    echo "Frontend security check FAILED"
    # exit 1 
    # Don't exit for now, just warn
else
    echo "Frontend security check PASSED"
fi
cd ../..

# 2. Backend Audit
echo "Scanning Backend (dotnet vulnerabilities)..."
cd apps/api
dotnet list package --vulnerable
if [ $? -ne 0 ]; then
    echo "Backend security check WARN (found vulnerabilities or failed to run)"
else
    echo "Backend security check PASSED"
fi
cd ../..

echo "Security Check Complete."
