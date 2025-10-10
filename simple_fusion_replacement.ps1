# Script simples para adicionar o card Fusion

# Ler o arquivo
$content = Get-Content "d:\Programas\React\171\frontend\src\components\StatisticsCards.tsx" -Raw

# Remover referências ao mostrarPadrao5x3Race dos props
$content = $content -replace "mostrarPadrao5x3Race\?\: boolean;", ""
$content = $content -replace "mostrarPadrao5x3Race = false,", ""

# Adicionar estados do Fusion após os estados do P2
$fusionStates = @"
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [fusionMode, setFusionMode] = useState<1 | 2>(1);
  const [animatingFusion, setAnimatingFusion] = useState<'none' | 'green' | 'yellow'>('none');
  const lastFusionConsecutiveState = useRef(false);
"@

$content = $content -replace "const lastP2ConsecutiveState = useRef\(false\);", "const lastP2ConsecutiveState = useRef(false);`n  $fusionStates"

# Adicionar cálculo das estatísticas do Fusion
$fusionCalc = @"
  // Calcular estatísticas do Fusion baseado nos últimos números
  const calculatedFusionStats = React.useMemo(() => {
    return fusionMode === 1 ? calculateFusionStats(lastNumbers) : calculateFusionStatsMode2(lastNumbers);
  }, [lastNumbers, fusionMode]);
"@

$content = $content -replace "// Calcular estatísticas do P2 baseado nos últimos números", "$fusionCalc`n`n  // Calcular estatísticas do P2 baseado nos últimos números"

# Salvar o arquivo
$content | Set-Content "d:\Programas\React\171\frontend\src\components\StatisticsCards.tsx"

Write-Host "Estados e cálculos do Fusion adicionados!"
