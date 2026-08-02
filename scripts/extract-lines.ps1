param(
    [string]$Path = 'c:\Users\Deogracia de Castro\Documents\Projetos\ManuGent\manugent\public\app\index.html',
    [int]$Start = 1,
    [int]$End = 10
)
$lines = Get-Content -Path $Path -Encoding UTF8
$count = 0
for ($i = $Start; $i -le $End -and $i -le $lines.Count; $i++) {
    $count++
    Write-Output ("{0}: {1}" -f $i, $lines[$i-1])
}
Write-Output ("=== Total lines in file: {0} ===" -f $lines.Count)

