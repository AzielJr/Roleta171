# Ponto de Restauração - 2026-01-17 10:11
# Tudo funcionando - Antes de alterar progressão de cores desktop

$backupDir = "d:\Programas\React\171\BACKUP_2026-01-17_10-11"
$sourceDir = "d:\Programas\React\171"

Write-Host "Criando ponto de restauração..." -ForegroundColor Green

# Criar diretório de backup
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\components" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\contexts" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\hooks" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\utils" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\lib" | Out-Null
New-Item -ItemType Directory -Force -Path "$backupDir\frontend\src\types" | Out-Null

# Copiar arquivos de configuração raiz
Copy-Item "$sourceDir\.env.local" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\.gitignore" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\vercel.json" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\netlify.toml" "$backupDir\" -ErrorAction SilentlyContinue

# Copiar documentação
Copy-Item "$sourceDir\*.md" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\*.txt" "$backupDir\" -ErrorAction SilentlyContinue

# Copiar frontend
Copy-Item "$sourceDir\frontend\package.json" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\package-lock.json" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\vite.config.ts" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\tsconfig.json" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\tsconfig.app.json" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\tsconfig.node.json" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\tailwind.config.js" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\postcss.config.js" "$backupDir\frontend\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\index.html" "$backupDir\frontend\" -ErrorAction SilentlyContinue

# Copiar src
Copy-Item "$sourceDir\frontend\src\App.tsx" "$backupDir\frontend\src\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\src\main.tsx" "$backupDir\frontend\src\" -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\frontend\src\index.css" "$backupDir\frontend\src\" -ErrorAction SilentlyContinue

# Copiar components
Copy-Item "$sourceDir\frontend\src\components\*.tsx" "$backupDir\frontend\src\components\" -ErrorAction SilentlyContinue

# Copiar contexts
Copy-Item "$sourceDir\frontend\src\contexts\*.tsx" "$backupDir\frontend\src\contexts\" -ErrorAction SilentlyContinue

# Copiar hooks
Copy-Item "$sourceDir\frontend\src\hooks\*.ts" "$backupDir\frontend\src\hooks\" -ErrorAction SilentlyContinue

# Copiar utils
Copy-Item "$sourceDir\frontend\src\utils\*.ts" "$backupDir\frontend\src\utils\" -ErrorAction SilentlyContinue

# Copiar lib
Copy-Item "$sourceDir\frontend\src\lib\*.ts" "$backupDir\frontend\src\lib\" -ErrorAction SilentlyContinue

# Copiar types
Copy-Item "$sourceDir\frontend\src\types\*.ts" "$backupDir\frontend\src\types\" -ErrorAction SilentlyContinue

Write-Host "`nBackup completo criado em: $backupDir" -ForegroundColor Green
Write-Host "Total de arquivos copiados:" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "`nPara restaurar, copie os arquivos de volta para $sourceDir" -ForegroundColor Yellow
