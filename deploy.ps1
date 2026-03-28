$KEY = "$env:USERPROFILE\.ssh\id_porter"
$SERVER = "root@10.10.0.3"
$REMOTE = "/var/www/html/employee-form"

# ── Build frontend ──
Write-Host "=== Building ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

# ── Upload src (for container rebuild) ──
Write-Host "=== Uploading src/ ===" -ForegroundColor Cyan
scp -i $KEY -r src\* "${SERVER}:${REMOTE}/src/"

# ── Upload dist (pre-built frontend) ──
Write-Host "=== Uploading dist/ ===" -ForegroundColor Cyan
scp -i $KEY -r dist\* "${SERVER}:${REMOTE}/dist/"

# ── Upload backend ──
Write-Host "=== Uploading backend/ ===" -ForegroundColor Cyan
scp -i $KEY backend\server.js "${SERVER}:${REMOTE}/backend/server.js"

# ── Upload config files ──
Write-Host "=== Uploading configs ===" -ForegroundColor Cyan
scp -i $KEY docker-compose.yml      "${SERVER}:${REMOTE}/docker-compose.yml"
scp -i $KEY Dockerfile.backend      "${SERVER}:${REMOTE}/Dockerfile.backend"
scp -i $KEY Dockerfile.frontend     "${SERVER}:${REMOTE}/Dockerfile.frontend"
scp -i $KEY nginx.frontend.conf     "${SERVER}:${REMOTE}/nginx.frontend.conf"
scp -i $KEY package.json            "${SERVER}:${REMOTE}/package.json"
scp -i $KEY package-lock.json       "${SERVER}:${REMOTE}/package-lock.json"

# ── Rebuild both containers ──
Write-Host "=== Rebuilding containers ===" -ForegroundColor Cyan
ssh -i $KEY $SERVER "cd $REMOTE && docker compose down && docker compose up -d --build 2>&1"

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "App: http://10.10.0.3:8001" -ForegroundColor Green