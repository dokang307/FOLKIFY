# PowerShell script to run Prisma migrations against Supabase
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Running Prisma migrations against Supabase" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set DIRECT_URL environment variable
$env:DIRECT_URL = "postgresql://postgres:Dokhang123!.@db.fjaqliowdfxdwpfmjldr.supabase.co:5432/postgres?connection_limit=1"

Write-Host "Running: npx prisma migrate deploy" -ForegroundColor Yellow
Write-Host ""

npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Migrations completed successfully" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "Migration failed" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    exit 1
}
