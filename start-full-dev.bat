@echo off
mode con: cols=120 lines=35
title Roleta 171 - Desenvolvimento Completo
color 0B
echo ========================================
echo    ROLETA 171 - DESENVOLVIMENTO LOCAL
echo ========================================
echo.
echo [1/5] Limpando processos anteriores...
echo       - Finalizando processos Node.js...
taskkill /IM node.exe /F >nul 2>&1
echo       - Liberando porta 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       - Liberando porta 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       ✓ Portas liberadas
echo.
echo [2/5] Verificando dependências do Backend...
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo       - Instalando npm packages do backend...
    npm install
    echo       ✓ Dependências do backend instaladas
) else (
    echo       ✓ node_modules do backend encontrado
)
echo.
echo [3/5] Verificando dependências do Frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo       - Instalando npm packages do frontend...
    npm install
    echo       ✓ Dependências do frontend instaladas
) else (
    echo       ✓ node_modules do frontend encontrado
)
echo.
echo [4/5] Iniciando Backend API (porta 3001)...
cd /d "%~dp0backend"
start "Backend API - Port 3001" cmd /c "mode con: cols=100 lines=25 && color 0E && title Backend API - localhost:3001 && npm run dev"
echo       ✓ Backend iniciando em nova janela
timeout /t 3 /nobreak >nul
echo.
echo [5/5] Iniciando Frontend React (porta 5173)...
cd /d "%~dp0frontend"
start "Frontend React - Port 5173" cmd /c "mode con: cols=100 lines=25 && color 0A && title Frontend React - localhost:5173 && npm run dev"
echo       ✓ Frontend iniciando em nova janela
echo.
echo ========================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:5173
echo.
echo    Aguardando 5 segundos para abrir o navegador...
echo ========================================
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo ✓ Navegador aberto!
echo.
echo Pressione qualquer tecla para fechar esta janela...
echo (Os servidores continuarão rodando em suas janelas)
pause >nul
