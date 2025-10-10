# Script para substituir o card 5x3 pelo card Fusion

# Ler o arquivo original
$content = Get-Content "d:\Programas\React\171\frontend\src\components\StatisticsCards.tsx" -Raw

# Adicionar import do fusionStats
$content = $content -replace "import { soundGenerator } from '../utils/soundUtils';", "import { soundGenerator } from '../utils/soundUtils';`nimport { calculateFusionStats, calculateFusionStatsMode2, FUSION_ENTRY_NUMBERS } from '../utils/fusionStats';"

# Remover props relacionados ao 5x3
$content = $content -replace "mostrarPadrao5x3Race\?\: boolean;", ""
$content = $content -replace "mostrarPadrao5x3Race = false,", ""

# Adicionar estados para Fusion
$content = $content -replace "const \[showTorreModal, setShowTorreModal\] = useState\(false\);", "const [showTorreModal, setShowTorreModal] = useState(false);`n  const [showFusionModal, setShowFusionModal] = useState(false);`n  const [fusionMode, setFusionMode] = useState<1 | 2>(1);`n  const [animatingFusion, setAnimatingFusion] = useState<'none' | 'green' | 'yellow'>('none');`n  const lastFusionConsecutiveState = useRef(false);"

# Adicionar cálculo das estatísticas do Fusion
$content = $content -replace "// Calcular estatísticas do 5x3", "// Calcular estatísticas do Fusion`n  const calculatedFusionStats = React.useMemo(() => {`n    return fusionMode === 1 ? calculateFusionStats(lastNumbers) : calculateFusionStatsMode2(lastNumbers);`n  }, [lastNumbers, fusionMode]);`n`n  // Calcular estatísticas do 5x3 (REMOVIDO)"

# Substituir o card 5x3 pelo card Fusion
$fusionCard = @"
        <StatCard
          title={
            <div className={`cursor-pointer transition-all duration-300 flex justify-between items-center `${
              animatingFusion === 'green' 
                ? 'animate-pulse-green-border' 
                : animatingFusion === 'yellow' 
                ? 'animate-pulse-yellow-border' 
                : ''
            }`} onClick={() => setShowFusionModal(true)}>
              <span>Fusion</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFusionMode(1);
                  }}
                  title="Com 1 padrão"
                  className={`rounded transition-all `${
                    fusionMode === 1 
                      ? 'px-2 py-1 text-xs bg-blue-500 text-white' 
                      : 'px-1 py-0.5 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 opacity-70 scale-90'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFusionMode(2);
                  }}
                  title="Com 2 padrões"
                  className={`rounded transition-all `${
                    fusionMode === 2 
                      ? 'px-2 py-1 text-xs bg-blue-500 text-white' 
                      : 'px-1 py-0.5 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 opacity-70 scale-90'
                  }`}
                >
                  2
                </button>
              </div>
            </div>
          }
          data={[
            { label: 'Entradas', value: calculatedFusionStats.entradas, percentage: totalNumbers > 0 ? Math.round((calculatedFusionStats.entradas / totalNumbers) * 100) : 0 },
            { label: 'WIN', value: calculatedFusionStats.wins, percentage: (calculatedFusionStats.wins + calculatedFusionStats.losses) > 0 ? Math.round((calculatedFusionStats.wins / (calculatedFusionStats.wins + calculatedFusionStats.losses)) * 100) : 0 },
            { label: 'LOSS', value: calculatedFusionStats.losses, percentage: (calculatedFusionStats.wins + calculatedFusionStats.losses) > 0 ? Math.round((calculatedFusionStats.losses / (calculatedFusionStats.wins + calculatedFusionStats.losses)) * 100) : 0 },
            { label: '> Seq. Negativa', value: calculatedFusionStats.maxNegativeSequence, percentage: calculatedFusionStats.entradas > 0 ? Math.round((calculatedFusionStats.maxNegativeSequence / calculatedFusionStats.entradas) * 100) : 0, hidePercentage: true }
          ]}
          colors={['bg-gray-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500']}
        />
"@

# Encontrar e substituir o card 5x3
$pattern = "<StatCard\s+title=\{\s*<div className=""flex justify-between items-center w-full"">\s*<span>5x3</span>.*?colors=\{'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-blue-500'\}\s*/>"
$content = $content -replace $pattern, $fusionCard, "Singleline"

# Salvar o arquivo modificado
$content | Set-Content "d:\Programas\React\171\frontend\src\components\StatisticsCards.tsx"

Write-Host "Substituição do card 5x3 pelo card Fusion concluída!"
