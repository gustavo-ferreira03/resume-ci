$root = Split-Path -Parent $PSScriptRoot

python -m pip install -r "$root\lib\requirements.txt"

$exe = Join-Path $root "bin\tectonic.exe"
if (Test-Path $exe) { exit 0 }

$null = New-Item -ItemType Directory -Force -Path (Join-Path $root "bin")

$tmp = "$env:TEMP\tectonic.zip"
$asset = (Invoke-RestMethod https://api.github.com/repos/tectonic-typesetting/tectonic/releases/latest).assets | Where-Object name -match 'windows.*\.zip'
Invoke-WebRequest $asset.browser_download_url -OutFile $tmp
Expand-Archive $tmp -DestinationPath (Join-Path $root "bin") -Force
Remove-Item $tmp
