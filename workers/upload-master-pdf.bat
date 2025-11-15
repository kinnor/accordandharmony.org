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
    exit /b 1
)

echo PDF found: %PDF_PATH%
echo.

REM Upload to R2 bucket (development)
echo Uploading to R2 bucket (development)...
call npx wrangler r2 object put accordharmony-files-dev/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="%PDF_PATH%" --content-type="application/pdf"

echo.
echo Upload complete!
echo.
echo To upload to production bucket, run:
echo npx wrangler r2 object put accordharmony-files-prod/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf --file="%PDF_PATH%" --content-type="application/pdf"
echo.
echo ==========================================
pause
