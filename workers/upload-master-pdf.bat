@echo off
REM Upload Master PDF to R2 Bucket
REM This script uploads the Jazz Trumpet Master Class PDF to the R2 bucket

echo ==========================================
echo Uploading Master PDF to R2 Bucket
echo ==========================================
echo.

REM Check if PDF exists
set "PDF_PATH=..\downloads\books\JAZZ_TRUMPET_MASTER_CLASS.pdf"
if not exist "%PDF_PATH%" (
    echo Error: PDF not found at %PDF_PATH%
    echo.
    echo Looking for: %CD%\%PDF_PATH%
    echo.
    echo Please ensure the PDF exists at:
    echo D:\Data Files\Project\web-accordandharmony\accordandharmony-fresh\downloads\books\JAZZ_TRUMPET_MASTER_CLASS.pdf
    pause
    exit /b 1
)

echo PDF found: %PDF_PATH%
echo File size:
dir "%PDF_PATH%" | find "JAZZ_TRUMPET"
echo.

REM Upload to R2 bucket (production)
echo Uploading to R2 bucket (production)...
call npx wrangler r2 object put accordharmony-files/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="%PDF_PATH%" --content-type="application/pdf"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo SUCCESS! PDF uploaded to R2
    echo ==========================================
    echo.
    echo Verifying upload...
    call npx wrangler r2 object list accordharmony-files --prefix=books/master/
) else (
    echo.
    echo ==========================================
    echo ERROR: Upload failed
    echo ==========================================
    echo.
    echo Please ensure:
    echo 1. R2 is enabled in Cloudflare Dashboard
    echo 2. Bucket 'accordharmony-files' exists
    echo 3. You are logged in: npx wrangler login
)
echo.
echo ==========================================
pause
