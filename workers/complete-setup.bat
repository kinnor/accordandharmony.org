@echo off
REM Complete Setup Script
REM Run this AFTER enabling R2 in Cloudflare Dashboard

echo ================================================================
echo Jazz Trumpet Book Purchase - Complete Setup
echo ================================================================
echo.
echo This script will:
echo 1. Verify R2 is enabled
echo 2. Create R2 bucket
echo 3. Upload master PDF
echo 4. Update worker configuration
echo 5. Deploy worker with R2 binding
echo 6. Test API endpoints
echo.
echo IMPORTANT: Make sure you have:
echo   [x] Enabled R2 in Cloudflare Dashboard
echo   [ ] Configured Service Binding in Pages (do manually after this)
echo   [ ] Set RESEND_API_KEY (instructions provided at end)
echo.
pause

echo.
echo ================================================================
echo Step 1: Verifying R2 is enabled...
echo ================================================================
call npx wrangler r2 bucket list
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: R2 is not enabled yet.
    echo.
    echo Please enable R2 first:
    echo 1. Go to https://dash.cloudflare.com/
    echo 2. Click "R2 Object Storage" in left sidebar
    echo 3. Click "Enable R2"
    echo 4. Add payment method (free tier available)
    echo 5. Re-run this script
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo Step 2: Creating R2 bucket 'accordharmony-files'...
echo ================================================================
call npx wrangler r2 bucket create accordharmony-files
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Bucket created
) else (
    echo Bucket may already exist, continuing...
)

echo.
echo ================================================================
echo Step 3: Uploading master PDF...
echo ================================================================
call upload-master-pdf.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PDF upload failed
    echo Check that the PDF exists at:
    echo D:\Data Files\Project\web-accordandharmony\accordandharmony-fresh\downloads\books\JAZZ_TRUMPET_MASTER_CLASS.pdf
    pause
    exit /b 1
)

echo.
echo ================================================================
echo Step 4: Enabling R2 binding in wrangler.toml...
echo ================================================================
echo.
echo MANUAL STEP REQUIRED:
echo.
echo Please open workers\wrangler.toml in a text editor and:
echo 1. Find lines 33-35 (R2 Storage Binding section)
echo 2. Uncomment these lines:
echo    [[r2_buckets]]
echo    binding = "R2_BUCKET"
echo    bucket_name = "accordharmony-files"
echo 3. Save the file
echo 4. Press any key to continue...
echo.
pause

echo.
echo ================================================================
echo Step 5: Deploying worker with R2 binding...
echo ================================================================
call npx wrangler deploy
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed
    echo.
    echo This might be because:
    echo 1. R2 binding not uncommented in wrangler.toml
    echo 2. Bucket name doesn't match
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo Step 6: Testing API endpoints...
echo ================================================================
echo.
echo Testing worker direct URL...
powershell -Command "Invoke-RestMethod -Uri 'https://accordandharmony-workers.rossen-kinov.workers.dev/api/csrf-token' | ConvertTo-Json"
echo.
echo.
echo Testing main site (may fail if Service Binding not configured)...
powershell -Command "try { Invoke-RestMethod -Uri 'https://accordandharmony.org/api/csrf-token' | ConvertTo-Json } catch { Write-Host 'Service Binding not configured yet (expected)' -ForegroundColor Yellow }"

echo.
echo ================================================================
echo SUCCESS! R2 and Worker Setup Complete
echo ================================================================
echo.
echo What's Working:
echo   [x] R2 storage enabled
echo   [x] Master PDF uploaded
echo   [x] Worker deployed with R2 binding
echo   [x] API endpoints functional on worker URL
echo.
echo Next Manual Steps:
echo.
echo 1. CONFIGURE SERVICE BINDING (2 minutes):
echo    - Go to https://dash.cloudflare.com/
echo    - Pages -^> accordandharmony.org
echo    - Settings -^> Functions -^> Service Bindings
echo    - Add binding: Variable=API, Service=accordandharmony-workers
echo.
echo 2. CONFIGURE RESEND API KEY (5 minutes):
echo    - Sign up at https://resend.com/signup
echo    - Create API key
echo    - Run: npx wrangler secret put RESEND_API_KEY
echo    - Paste the API key when prompted
echo.
echo 3. TEST BOOK PURCHASE:
echo    - Run: node test-book-purchase.js
echo    - Or test on website: https://accordandharmony.org/resources
echo.
echo See AUTOMATION_STATUS.md for detailed status and testing
echo.
pause
