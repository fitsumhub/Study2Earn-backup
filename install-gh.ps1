[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
$msiPath = "$env:TEMP\gh.msi"
Write-Host "Downloading GitHub CLI..."
Invoke-WebRequest -Uri 'https://github.com/cli/cli/releases/download/v2.58.0/gh_2.58.0_windows_amd64.msi' -OutFile $msiPath
Write-Host "Installing GitHub CLI..."
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$msiPath`" /quiet"
Write-Host "Cleaning up..."
Remove-Item $msiPath -ErrorAction SilentlyContinue
Write-Host "Installation complete!"

