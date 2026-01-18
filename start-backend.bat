@echo off
mode con: cols=120 lines=30
title Backend API - Porta 3001
color 0E
echo ========================================
echo    INICIANDO BACKEND API - MySQL
echo ========================================
echo.
echo [1/4] Finalizando processos Node.js na porta 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo       Finalizando PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo       ✓ Porta 3001 liberada
echo.
echo [2/4] Navegando para backend...
cd /d "%~dp0backend"
echo       ✓ Diretório: %CD%
echo.
echo [3/4] Verificando dependências...
if not exist "node_modules" (
    echo       - Instalando npm packages...
    npm install
    echo       ✓ Dependências instaladas
) else (
    echo       ✓ node_modules encontrado
)
echo.
echo [4/4] Iniciando servidor backend...
echo       ✓ Backend rodando em http://localhost:3001
echo.
echo ========================================
echo    BACKEND ATIVO - Aguardando requisições
echo ========================================
echo.
npm run dev
