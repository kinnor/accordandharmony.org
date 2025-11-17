$body = @{
    email = "rossen.kinov@gmail.com"
    name = "Rossen Kinov"
    language = "en"
    amount = "19.99"
    currency = "USD"
    paypalOrderId = "TEST-LIVE-1763353500"
} | ConvertTo-Json

Write-Host "Testing Book Purchase API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://accordandharmony-workers.rossen-kinov.workers.dev/api/book-purchase" -Method Post -Body $body -ContentType "application/json"

    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)

    if ($response.success) {
        Write-Host ""
        Write-Host "Check your email at: rossen@kinov.com" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
