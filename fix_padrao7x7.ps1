# Script para corrigir e adicionar Padrão 7x7
$filePath = "d:\Programas\React\171\frontend\src\components\RouletteBoard.tsx"

# Ler o conteúdo
$lines = Get-Content $filePath

# Encontrar as linhas com isDetectedBetNumber e adicionar as variáveis do Padrão 7x7
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "const isDetectedBetNumber = patternAlert\?\.\?type === 'race' && alertaPadrao171Ativo && patternAlert\?\.\?betNumbers\?\.\?includes\(num\);") {
        # Inserir as novas linhas após esta linha
        $newLines = @(
            $lines[$i],
            "                        ",
            "                        // Verificar se é um dos números do Padrão 7x7 (apenas se configuração ativa)",
            "                        const isPadrao7x7Suggested = mostrarPadrao7x7Race && (padrao7x7Numbers.first === num || padrao7x7Numbers.second === num);",
            "                        const isPadrao7x7Loss = mostrarPadrao7x7Race && padrao7x7Numbers.lossNumbers.includes(num);"
        )
        
        # Substituir a linha atual pelas novas linhas
        $lines[$i] = $newLines -join "`r`n"
    }
}

# Salvar o arquivo
$lines | Set-Content $filePath -Encoding UTF8

Write-Host "Variáveis do Padrão 7x7 adicionadas!"
