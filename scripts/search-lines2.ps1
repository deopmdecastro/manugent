param(
    [string]$Path = 'c:\Users\Deogracia de Castro\Documents\Projetos\ManuGent\manugent\public\app\index.html'
)
$patterns = @('visíveis', 'visiveis', 'APP\.technicians\s*=', 'technicians\s*:\s*\[', 'getContextSummary', 'getAIScope')
$lines = Get-Content -Path $Path -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($p in $patterns) {
        if ($lines[$i] -match $p) {
            Write-Output ("{0}: {1}" -f ($i+1), $lines[$i])
            break
        }
    }
}

