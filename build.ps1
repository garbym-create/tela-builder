# מזריק את goals-bank.json לתוך index.html.
# להריץ אחרי כל עריכה של הבנק:  powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bankPath = Join-Path $root 'goals-bank.json'
$htmlPath = Join-Path $root 'index.html'

$bank = Get-Content $bankPath -Raw -Encoding UTF8 | ConvertFrom-Json | ConvertTo-Json -Depth 30 -Compress
$html = Get-Content $htmlPath -Raw -Encoding UTF8

$pattern = '(?s)(<script id="bank" type="application/json">).*?(</script>)'
if ($html -notmatch $pattern) { throw "לא נמצא התג <script id=""bank""> בקובץ index.html" }
$html = [System.Text.RegularExpressions.Regex]::Replace(
  $html, $pattern, { param($m) $m.Groups[1].Value + $bank + $m.Groups[2].Value })

[System.IO.File]::WriteAllText($htmlPath, $html, (New-Object System.Text.UTF8Encoding($false)))

$stats = Get-Content $bankPath -Raw -Encoding UTF8 | ConvertFrom-Json
"הבנק הוזרק: $($stats.statements.Count) היגדים, $($stats.goals.Count) מטרות, $($stats.domains.Count) תחומים ($($bank.Length) תווים)"
