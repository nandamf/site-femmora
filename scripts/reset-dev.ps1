$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker não foi encontrado. Instale/inicie o Docker Desktop antes de reconstruir o Supabase local."
}

if (-not (Test-Path -LiteralPath "node_modules/.bin/supabase.cmd")) {
  throw "Supabase CLI local não encontrado. Execute npm install antes de reconstruir o ambiente."
}

Write-Host "Reconstruindo banco local, aplicando migrations e seed oficial..."
& "node_modules/.bin/supabase.cmd" db reset
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao executar supabase db reset (código $LASTEXITCODE)."
}

Write-Host "Ambiente de desenvolvimento reconstruído com sucesso."
