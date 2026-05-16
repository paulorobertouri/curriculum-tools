# PowerShell script to rename the Vite React template project
# Usage: ./rename-template.ps1 NewProjectName
param(
    [Parameter(Mandatory = $true)]
    [string]$NewName
)

# Replace all occurrences of 'vite-react-template' and 'Vite React Template' in all files
Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    (Get-Content $_.FullName) -replace 'vite-react-template', $NewName -replace 'Vite React Template', $NewName | Set-Content $_.FullName
}

Write-Host "Renamed project to $NewName. Please update package.json manually if needed."
