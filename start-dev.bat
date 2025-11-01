@echo off
mode con: cols=120 lines=30
title React Dev - Porta 5173
color 0A
echo ========================================
echo    INICIANDO PROJETO REACT - 1233x768
echo ========================================
echo.
echo [1/6] Finalizando processos Node.js e Vite...
echo       - Finalizando processos node.exe...
taskkill /IM node.exe /F >nul 2>&1
echo       - Finalizando processos relacionados ao Vite...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| find "node.exe"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       - Liberando porta 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo         Finalizando PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo       ✓ Processos finalizados e porta liberada
echo.
echo [2/6] Navegando para frontend...
cd /d "%~dp0frontend"
echo       ✓ Diretório: %CD%
echo.
echo [3/6] Verificando dependências...
if not exist "node_modules" (
    echo       - Instalando npm packages...
    npm install --silent
    echo       ✓ Dependências instaladas
) else (
    echo       ✓ node_modules encontrado
)
echo.
echo [4/6] Aguardando estabilização...
timeout /t 2 /nobreak >nul
echo       ✓ Sistema estabilizado
echo.
echo [5/6] Iniciando servidor...
start "React Dev" cmd /c "mode con: cols=100 lines=25 && color 0B && title React Server - localhost:5173 && npm run dev"
echo       ✓ Servidor iniciando em nova janela
echo.
echo [6/6] Aguardando e abrindo browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo       ✓ Browser aberto: http://localhost:5173
echo.
echo ========================================
echo    PROCESSO CONCLUÍDO COM SUCESSO!
echo    Servidor: localhost:5173
echo    Resolução otimizada: 1233x768
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul