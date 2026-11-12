$ErrorActionPreference='Stop'
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$d = $w.Documents.Open('C:\Temp\elec\v11.docx', $false, $true)
Write-Output ("pages=" + $d.ComputeStatistics(2))
$d.ExportAsFixedFormat('C:\Temp\elec\out.pdf', 17, $false, 0, 0, 1, 4, 0, $true)
Write-Output "exported"
$d.Close(0)
$w.Quit()
