$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root "lib\bin"
$tmp = "$env:TEMP\resume-ci-setup"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    irm bun.sh/install.ps1 | iex
    $env:PATH = "$HOME\.bun\bin;$env:PATH"
}

bun install --cwd $root

if (-not (Test-Path (Join-Path $bin "typst.exe"))) {
    $asset = (Invoke-RestMethod https://api.github.com/repos/typst/typst/releases/latest).assets | Where-Object name -match 'x86_64-pc-windows-msvc\.zip$' | Select-Object -First 1
    Invoke-WebRequest $asset.browser_download_url -OutFile "$tmp\typst.zip"
    Expand-Archive "$tmp\typst.zip" -DestinationPath "$tmp\typst" -Force
    New-Item -ItemType Directory -Force -Path $bin | Out-Null
    Move-Item (Get-ChildItem "$tmp\typst" -Filter typst.exe -Recurse | Select-Object -First 1).FullName (Join-Path $bin "typst.exe") -Force
}

if (-not (Test-Path (Join-Path $bin "fonts"))) {
    $asset = (Invoke-RestMethod https://api.github.com/repos/FortAwesome/Font-Awesome/releases/latest).assets | Where-Object name -like '*-desktop.zip' | Select-Object -First 1
    Invoke-WebRequest $asset.browser_download_url -OutFile "$tmp\fa.zip"
    Expand-Archive "$tmp\fa.zip" -DestinationPath "$tmp\fa" -Force
    New-Item -ItemType Directory -Force -Path (Join-Path $bin "fonts") | Out-Null
    Get-ChildItem "$tmp\fa" -Filter *.otf -Recurse | Copy-Item -Destination (Join-Path $bin "fonts")
}

Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
