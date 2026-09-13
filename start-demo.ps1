# start-demo.ps1  —  One-command local demo for the Blockchain Land Registry.
# 1) Starts a local Hardhat node (new window)   [reuses one already running]
# 2) Deploys LandRegistry + seeds 4 sample properties (PROP-1001 .. PROP-1004)
# 3) Launches the React frontend at http://localhost:3000
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File start-demo.ps1
#   (or on Windows: npm run demo)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$frontend = Join-Path $root "frontend"

function Test-Port([string]$hostName, [int]$port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($hostName, $port, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(500)) {
            $client.EndConnect($async)
            return $true
        }
    } catch {
        return $false
    } finally {
        $client.Close()
    }
    return $false
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Blockchain Land Registry - Local Demo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 1) Start the Hardhat node in its own window (or re-use one already running).
$nodeReady = Test-Port "127.0.0.1" 8545
if ($nodeReady) {
    Write-Host "[1/3] A Hardhat node is already running on http://127.0.0.1:8545 - reusing it." -ForegroundColor Yellow
} else {
    Write-Host "[1/3] Starting Hardhat local node on http://127.0.0.1:8545 ..."
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root'; npm run node"
    $nodeReady = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port "127.0.0.1" 8545) {
            $nodeReady = $true
            break
        }
    }
    if (-not $nodeReady) {
        Write-Host "FAILED: Hardhat node did not start within 40 seconds." -ForegroundColor Red
        Write-Host "Tip: run 'npm run node' manually in a terminal and re-run this script." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[1/3] Node is up." -ForegroundColor Green
}

# 2) Deploy + seed sample properties into the running node.
Write-Host "[2/3] Deploying LandRegistry and seeding sample properties ..."
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Seed step errored. See output above." -ForegroundColor Red
    exit 1
}
Write-Host "[2/3] Seed complete." -ForegroundColor Green

# 3) Launch the frontend in its own window.
$frontReady = Test-Port "127.0.0.1" 3000
if ($frontReady) {
    Write-Host "[3/3] The frontend is already running on http://localhost:3000 - keeping it." -ForegroundColor Yellow
} else {
    Write-Host "[3/3] Launching React frontend at http://localhost:3000 ..."
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$frontend'; npm run dev"
    $frontReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port "127.0.0.1" 3000) {
            $frontReady = $true
            break
        }
    }
    if (-not $frontReady) {
        Write-Host "FAILED: The frontend did not start on http://localhost:3000 within 30 seconds." -ForegroundColor Red
        Write-Host "Tip: check the new 'frontend' PowerShell window for errors, or run 'npm run dev' inside the frontend/ folder." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[3/3] Frontend is up." -ForegroundColor Green
}

Write-Host ""
Write-Host "Demo is running:" -ForegroundColor Green
Write-Host "  - Frontend   : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Local node : http://127.0.0.1:8545 (chainId 31337)" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the browser shows a blank page, hard-refresh with Ctrl+Shift+R (cache) and try again." -ForegroundColor Yellow
Write-Host ""
Write-Host "The app auto-connects to the local node (read-only), so you can"
Write-Host "search PROP-1001 .. PROP-1004 immediately. To submit transactions:"
Write-Host "  1) Open MetaMask, add network http://localhost:8545 (chainId 31337)"
Write-Host "  2) Import this Hardhat private key (Account 0 = admin/registrar/notary):"
Write-Host "     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
Write-Host "  3) Click  Connect Wallet, then register/verify/transfer." -ForegroundColor Yellow