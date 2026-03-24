# ============================================
# Pre-Deployment Script
# Copies prisma folder to each backend
# ============================================

Write-Host "📦 Preparing backends for deployment..." -ForegroundColor Cyan
Write-Host ""

# Copy prisma to admin backend
Write-Host "Copying prisma to fyp-admin/backend..." -ForegroundColor Yellow
Copy-Item -Recurse -Force prisma fyp-admin\backend\prisma
Write-Host "  ✓ Done" -ForegroundColor Green

# Copy prisma to doctor backend
Write-Host "Copying prisma to fyp-doctor/backend..." -ForegroundColor Yellow
Copy-Item -Recurse -Force prisma fyp-doctor\backend\prisma
Write-Host "  ✓ Done" -ForegroundColor Green

# Copy prisma to patient backend
Write-Host "Copying prisma to fyp-patient/backend..." -ForegroundColor Yellow
Copy-Item -Recurse -Force prisma fyp-patient\backend\prisma
Write-Host "  ✓ Done" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All backends are ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update DATABASE_URL in each backend's .env to production database"
Write-Host "   2. Deploy admin backend first and run migrations"
Write-Host "   3. Deploy doctor and patient backends (no migrations)"
Write-Host ""
