$ErrorActionPreference='Stop'
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$d = $w.Documents.Open('D:\Tải Xuống\app\work\v1.docx', $false, $false)
Write-Output "opened v1"
$d.SaveAs2('D:\Tải Xuống\app\work\test_save.docx', 16)
Write-Output "saved"
$d.Close(0)
$w.Quit()
Write-Output "ok"
