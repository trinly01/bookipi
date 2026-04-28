# Quick API Test Script
# Tests the flash sale backend endpoints

$baseUrl = "http://localhost:3000"

Write-Host "=== Flash Sale API Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check
Write-Host "1. Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Sale status
Write-Host "2. Sale Status:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sale/status" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Sale info
Write-Host "3. Sale Info:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sale/info" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Purchase attempt
Write-Host "4. Purchase Attempt (user: test123):" -ForegroundColor Yellow
try {
    $body = '{"userId":"test123"}' | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sale/purchase" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        Write-Host "   Body: $body" -ForegroundColor Red
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check purchase
Write-Host "5. Check Purchase (user: test123):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sale/purchase/test123" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        Write-Host "   Body: $body" -ForegroundColor Red
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check purchase
Write-Host "5. Check Purchase (user: test123):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/sale/purchase/test123" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Body: $($response.Content)"
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
