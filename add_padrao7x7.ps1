# Script para adicionar verificações do Padrão 7x7
$filePath = "d:\Programas\React\171\frontend\src\components\RouletteBoard.tsx"
$content = Get-Content $filePath -Raw

# Adicionar as variáveis do Padrão 7x7 após isDetectedBetNumber
$oldPattern = 'const isDetectedBetNumber = patternAlert\?\.\?type === ''race'' && alertaPadrao171Ativo && patternAlert\?\.\?betNumbers\?\.\?includes\(num\);'
$newPattern = @'
const isDetectedBetNumber = patternAlert?.type === 'race' && alertaPadrao171Ativo && patternAlert?.betNumbers?.includes(num);
                        
                        // Verificar se é um dos números do Padrão 7x7 (apenas se configuração ativa)
                        const isPadrao7x7Suggested = mostrarPadrao7x7Race && (padrao7x7Numbers.first === num || padrao7x7Numbers.second === num);
                        const isPadrao7x7Loss = mostrarPadrao7x7Race && padrao7x7Numbers.lossNumbers.includes(num);
'@

$content = $content -replace $oldPattern, $newPattern

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8

Write-Host "Variáveis do Padrão 7x7 adicionadas com sucesso!"
