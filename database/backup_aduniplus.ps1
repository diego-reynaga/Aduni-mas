param(
    [string]$Database = "aduniplus",
    [string]$User = "root",
    [string]$Password = "12345678",
    [string]$HostName = "localhost",
    [string]$OutputDir = "database/backups"
)

$ErrorActionPreference = "Stop"

$dump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $dump) {
    throw "No se encontro mysqldump en el PATH. Instale MySQL Client o agregue la carpeta bin de MySQL al PATH antes de respaldar."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$output = Join-Path $OutputDir "$Database`_$timestamp.sql"

& $dump.Source `
    "--host=$HostName" `
    "--user=$User" `
    "--password=$Password" `
    "--single-transaction" `
    "--routines" `
    "--triggers" `
    "--events" `
    "--databases" $Database |
    Set-Content -Path $output -Encoding UTF8

Write-Host "Respaldo creado: $output"
