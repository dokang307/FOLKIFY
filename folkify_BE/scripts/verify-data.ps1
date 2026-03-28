# PowerShell script to verify Supabase data
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Verifying Supabase database data" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set DATABASE_URL environment variable
$env:DATABASE_URL = "postgresql://postgres.fjaqliowdfxdwpfmjldr:Dokhang123!.@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

Write-Host "Running verification script..." -ForegroundColor Yellow
Write-Host ""

npx ts-node scripts/verify-supabase-data.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Verification completed successfully" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "Verification failed" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    exit 1
}
