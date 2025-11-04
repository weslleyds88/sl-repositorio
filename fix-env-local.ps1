# Script para corrigir o problema do .env.local
# Execute: .\fix-env-local.ps1

$projectPath = Get-Location

# Verificar se o arquivo existe
if (Test-Path "$projectPath\.env.local") {
    Write-Host "Removendo .env.local com problema..."
    Remove-Item "$projectPath\.env.local" -Force
    Write-Host "✅ Arquivo removido com sucesso!"
} else {
    Write-Host "Arquivo .env.local não encontrado"
}

Write-Host ""
Write-Host "Agora execute:"
Write-Host "npx supabase@latest link --project-ref wgaqgsblpersthvytcif"

