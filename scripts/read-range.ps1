param(
  [Parameter(Mandatory = $true)][string]$path,
  [Parameter(Mandatory = $true)][int]$start,
  [Parameter(Mandatory = $false)][int]$end = $start
)
$c = Get-Content $path
$hi = [Math]::Min($end, $c.Length)
for ($i = $start; $i -le $hi; $i++) {
  "{0,6}: {1}" -f $i, $c[$i - 1]
}

