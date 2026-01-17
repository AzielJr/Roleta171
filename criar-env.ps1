$envContent = @'
VITE_SUPABASE_URL=https://nkkeajeaniqaywdxwvuk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra2VhamVhbmlxYXl3ZHh3dnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5MjY4OTIsImV4cCI6MjAzNzUwMjg5Mn0.kUvsDc5Jd-yetfLFgfyZLKC5tI4V2d0UCZrZv3neAuY
'@

$envContent | Out-File -FilePath "d:\Programas\React\171\frontend\.env.local" -Encoding UTF8

Write-Host "Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host "Conteúdo:" -ForegroundColor Cyan
Get-Content "d:\Programas\React\171\frontend\.env.local"
