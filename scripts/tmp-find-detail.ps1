param(
    [string]$Path = 'c:\Users\Deogracia de Castro\Documents\Projetos\ManuGent\manugent\public\app\index.html',
    [string]$Pattern = 'detail-page|mobile-detail-active|detail-page\.'
)
$lines = Get-Content -Path $Path -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $Pattern) {
        $line = $lines[$i]
        if ($line.Length -gt 220) { $line = $line.Substring(0, 220) }
        Write-Output ("{0}: {1}" -f ($i + 1), $line)
    }
}
