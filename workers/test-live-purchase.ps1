# Test Live Book Purchase API
# This tests the actual deployed worker with real R2

$baseUrl = "https://accordandharmony-workers.rossen-kinov.workers.dev"

Write-Host "============================================================"
Write-Host "Testing Live Book Purchase API" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""

# Test data
$purchaseData = @{
    email = "rossen@kinov.com"
    name = "Rossen Kinov"
    language = "en"
    amount = "19.99"
    currency = "USD"
    paypalOrderId = "TEST-LIVE-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

Write-Host "Test Case: Live Book Purchase" -ForegroundColor Yellow
Write-Host "Request Data:" -ForegroundColor Yellow
Write-Host $purchaseData
Write-Host ""

try {
    Write-Host "Calling: POST $baseUrl/api/book-purchase" -ForegroundColor Green

    $response = Invoke-RestMethod -Uri "$baseUrl/api/book-purchase" `
        -Method Post `
        -Body $purchaseData `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "Response Status: SUCCESS" -ForegroundColor Green
    Write-Host "Response Data:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)

    if ($response.success) {
        Write-Host ""
        Write-Host "✓ TEST PASSED" -ForegroundColor Green
        Write-Host ""
        Write-Host "What happened:" -ForegroundColor Cyan
        Write-Host "  1. PDF retrieved from R2: books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf"
        Write-Host "  2. PDF watermarked with: Rossen Kinov"
        Write-Host "  3. Watermarked PDF saved to R2"
        Write-Host "  4. Download token generated"
        Write-Host "  5. Email attempt (may fail if RESEND_API_KEY not set)"
        Write-Host ""
        Write-Host "Download Link:" -ForegroundColor Yellow
        Write-Host "  $($response.data.downloadLink)"
    } else {
        Write-Host ""
        Write-Host "✗ TEST FAILED" -ForegroundColor Red
        Write-Host "  Error: $($response.message)"
    }

} catch {
    Write-Host ""
    Write-Host "✗ TEST FAILED - Request Error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        try {
            $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ($errorData | ConvertTo-Json -Depth 10)
        } catch {
            Write-Host $_.ErrorDetails.Message
        }
    }
}

Write-Host ""
Write-Host "============================================================"
