# start-demo.ps1  —  One-command local demo for the Blockchain Land Registry.
# 1) Starts a local Hardhat node (new window)
# 2) Deploys LandRegistry + seeds 4 sample properties (PROP-1001 .. PROP-1004)
# 3) Launches the React frontend at http://localhost:3000
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File start-demo.ps1
#   (or on Windows: npm run demo)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$frontend = Join-Path $root "frontend"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Blockchain Land Registry - Local Demo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1) Start the Hardhat node in its own window.
Write-Host "[1/3] Starting Hardhat local node on http://127.0.0.1:8545 ..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root'; npm run node"

# 2) Wait for the node to accept connections.
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    if (Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -InformationLevel Quiet -WarningAction SilentlyContinue) {
        $ready = $true
        break
    }
}
if (-not $ready) {
    Write-Host "FAILED: Hardhat node did not start within 40 seconds." -ForegroundColor Red
    exit 1
}
Write-Host "[1/3] Node is up." -ForegroundColor Green

# 3) Deploy + seed sample properties into the running node.
Write-Host "[2/3] Deploying LandRegistry and seeding sample properties ..."
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Seed step errored. See output above." -ForegroundColor Red
    exit 1
}
Write-Host "[2/3] Seed complete." -ForegroundColor Green

# 4) Launch the frontend in its own window.
Write-Host "[3/3] Launching React frontend at http://localhost:3000 ..."
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$frontend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Demo is running:" -ForegroundColor Green
Write-Host "  - Frontend   : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Local node : http://127.0.0.1:8545 (chainId 31337)" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app auto-connects to the local node (read-only), so you can"
Write-Host "search PROP-1001 .. PROP-1004 immediately. To submit transactions:"
Write-Host "  1) Open MetaMask, add network http://localhost:8545 (chainId 31337)"
Write-Host "  2) Import this Hardhat private key (Account 0 = admin/registrar/notary):"
Write-Host "     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
Write-Host "  3) Click  Connect Wallet, then register/verify/transfer." -ForegroundColor Yellow