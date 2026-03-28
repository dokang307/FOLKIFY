# PowerShell script to seed Supabase database
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Seeding Supabase database" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Set DATABASE_URL environment variable
$env:DATABASE_URL = "postgresql://postgres.fjaqliowdfxdwpfmjldr:Dokhang123!.@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

Write-Host "This will create:" -ForegroundColor Yellow
Write-Host "  - Admin user (admin@folkify.com)" -ForegroundColor Yellow
Write-Host "  - 5 traditional Vietnamese instruments" -ForegroundColor Yellow
Write-Host "  - 8 lessons per instrument (3 free, 5 premium)" -ForegroundColor Yellow
Write-Host "  - 4 sheet music items per instrument" -ForegroundColor Yellow
Write-Host ""

Write-Host "Running: npx prisma db seed" -ForegroundColor Yellow
Write-Host ""

npx prisma db seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Database seeded successfully" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Default admin credentials:" -ForegroundColor Cyan
    Write-Host "  Email: admin@folkify.com" -ForegroundColor Cyan
    Write-Host "  Password: admin123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Remember to change the admin password in production!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "Seeding failed" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    exit 1
}
