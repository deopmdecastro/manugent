param(
    [string]$Path = 'c:\Users\Deogracia de Castro\Documents\Projetos\ManuGent\manugent\public\app\index.html',
    [string]$Pattern = 'incidente|Incidente|incident|workOrder|WorkOrder|work_order|ordem|Ordem|renderWork|renderOs|workOrders|workOrder|abrirIncidente|openIncident|detalhe|Detalhe|viewIncident|visualizar'
)
$lines = Get-Content -Path $Path -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $Pattern) {
        $line = $lines[$i]
        if ($line.Length -gt 200) { $line = $line.Substring(0,200) }
        Write-Output ("{0}: {1}" -f ($i+1), $line)
    }
}
