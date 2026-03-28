# PowerShell script to make shell scripts executable via WSL
# This script sets the executable bit on migrate.sh and seed-supabase.sh

Write-Host "Making scripts executable via WSL..." -ForegroundColor Cyan

try {
    # Get the current directory
    $currentDir = Get-Location
    
    # Convert Windows path to WSL path
    $wslPath = $currentDir.Path -replace '\\', '/' -replace '^([A-Z]):', { '/mnt/' + $_.Groups[1].Value.ToLower() }
    
    Write-Host "Current directory: $currentDir" -ForegroundColor Gray
    Write-Host "WSL path: $wslPath" -ForegroundColor Gray
    Write-Host ""
    
    # Make migrate.sh executable
    Write-Host "Setting executable bit on migrate.sh..." -ForegroundColor Yellow
    wsl bash -c "cd '$wslPath/folkify_BE/scripts' && chmod +x migrate.sh && ls -la migrate.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ migrate.sh is now executable" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to make migrate.sh executable" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    
    # Make seed-supabase.sh executable
    Write-Host "Setting executable bit on seed-supabase.sh..." -ForegroundColor Yellow
    wsl bash -c "cd '$wslPath/folkify_BE/scripts' && chmod +x seed-supabase.sh && ls -la seed-supabase.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ seed-supabase.sh is now executable" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to make seed-supabase.sh executable" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "✓ All scripts are now executable" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can now run the scripts directly:" -ForegroundColor Gray
    Write-Host "  ./folkify_BE/scripts/migrate.sh" -ForegroundColor Gray
    Write-Host "  ./folkify_BE/scripts/seed-supabase.sh" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "✗ Error occurred" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure WSL is installed and accessible." -ForegroundColor Yellow
    Write-Host "You can install WSL by running: wsl --install" -ForegroundColor Yellow
    exit 1
}
