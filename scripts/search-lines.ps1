param(
    [string]$Path = 'c:\Users\Deogracia de Castro\Documents\Projetos\ManuGent\manugent\public\app\index.html',
    [string]$Pattern = 't[eé]cnico|T[eé]cnico|TECNICO'
)
$lines = Get-Content -Path $Path -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $Pattern) {
        Write-Output ("{0}: {1}" -f ($i+1), $lines[$i])
    }
}

