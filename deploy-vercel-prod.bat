@echo off
setlocal

if "%VERCEL_TOKEN%"=="" (
  echo ERRO: defina a variavel de ambiente VERCEL_TOKEN com seu token.
  exit /b 1
)

cd /d "%~dp0"
echo Verificando vinculo do projeto com Vercel...
if exist ".vercel\project.json" (
  echo Projeto ja vinculado.
) else (
  npx vercel link --project roleta171 --yes --token %VERCEL_TOKEN%
  if errorlevel 1 (
    echo Falha ao vincular projeto.
    exit /b 1
  )
)

echo Construindo frontend...
cd frontend
npm run build
if errorlevel 1 (
  echo Falha no build.
  exit /b 1
)
cd ..

echo Publicando em producao no Vercel...
npx vercel --prod --yes --token %VERCEL_TOKEN%
if errorlevel 1 (
  echo Falha no deploy.
  exit /b 1
)

echo Deploy concluido.
endlocal
