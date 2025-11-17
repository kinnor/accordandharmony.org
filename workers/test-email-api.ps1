$body = @{
    to = "rossen.kinov@gmail.com"
    name = "Rossen Kinov"
    language = "en"
    type = "book"
} | ConvertTo-Json

Write-Host "Testing Email API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://accordandharmony-workers.rossen-kinov.workers.dev/api/test-email" -Method Post -Body $body -ContentType "application/json"

    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
