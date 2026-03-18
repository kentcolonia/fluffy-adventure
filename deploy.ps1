$KEY = "$env:USERPROFILE\.ssh\id_porter"
$SERVER = "root@10.10.0.3"
$REMOTE = "/var/www/html/employee-form"

Write-Host "=== Building ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

Write-Host "=== Uploading src files ===" -ForegroundColor Cyan
scp -i $KEY -r src\* "${SERVER}:${REMOTE}/src/"

Write-Host "=== Uploading dist files ===" -ForegroundColor Cyan  
scp -i $KEY -r dist\* "${SERVER}:${REMOTE}/dist/"

Write-Host "=== Rebuilding container ===" -ForegroundColor Cyan
ssh -i $KEY $SERVER "cd $REMOTE && docker compose up -d --build employee-frontend 2>&1"

Write-Host "=== Done! http://10.10.0.3:8001 ===" -ForegroundColor Green
