# Script para configurar Supabase local
# Execute: .\configure-supabase.ps1

$envFile = "d:\Programas\React\171\frontend\.env.local"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração do Supabase Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Instruções:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecione seu projeto" -ForegroundColor White
Write-Host "3. Vá em Settings → API" -ForegroundColor White
Write-Host ""

# Solicitar URL do Supabase
Write-Host "🔗 Project URL:" -ForegroundColor Green
Write-Host "   (exemplo: https://xxxxxxxxxxxxx.supabase.co)" -ForegroundColor Gray
$supabaseUrl = Read-Host "Digite a URL"

Write-Host ""
Write-Host "🔑 Anon Public Key:" -ForegroundColor Green
Write-Host "   (chave longa que começa com eyJ...)" -ForegroundColor Gray
$supabaseKey = Read-Host "Digite a chave"

# Validar inputs
if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host ""
    Write-Host "❌ Erro: URL ou chave não podem estar vazias!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Criar conteúdo do arquivo
$content = @"
# Configuração do Supabase para desenvolvimento local
# Gerado automaticamente em $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

# Salvar arquivo
try {
    $content | Out-File -FilePath $envFile -Encoding UTF8 -Force
    
    Write-Host ""
    Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Local: $envFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔄 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Pare o servidor atual (Ctrl+C no terminal do npm)" -ForegroundColor White
    Write-Host "   2. Execute: cd frontend" -ForegroundColor White
    Write-Host "   3. Execute: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ Pronto! Agora você pode testar localmente!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar arquivo: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
