# Variables
$zipUrl = "https://scdp.blob.core.windows.net/downloads/Sitecore%20Experience%20Platform/103/Sitecore%20Experience%20Platform%20103%20Update1/Secure/Sitecore%2010.3.1%20rev.%20009452%20(WDP%20XP0%20packages).zip"
$zipFilePath = "C:\inetpub\wwwroot\Sitecore 10.3.1 rev. 009452 (WDP XP0 packages).zip"
$zipFolder = "C:\inetpub\wwwroot\sitecore10.3.1"
$sitecoreUpgradePackage = $zipFolder + "\Sitecore 10.3.1 rev. 009452 (OnPrem)_single.scwdp.zip"
$sitecoreUpgradeZipFolder = $zipFolder + "\sitecore"
$sitecoreUpgradeWebsiteFolder = $sitecoreUpgradeZipFolder + "\Content\Website"
$xconnectUpgradePackage = $zipFolder + "\Sitecore 10.3.1 rev. 009452 (OnPrem)_xp0xconnect.scwdp.zip"
$xconnectUpgradeZipFolder = $zipFolder + "\xconnect"
$xconnectUpgradeWebsiteFolder = $xconnectUpgradeZipFolder + "\Content\Website"
$identityServerServerPackage = $zipFolder + "\Sitecore.IdentityServer 7.0 rev. 326 (OnPrem)_identityserver.scwdp.zip"
$identityServerZipFolder = $zipFolder + "\identityServer"
$identityServerWebsiteFolder = $identityServerZipFolder + "\Content\Website"
$MAServiceName = "sc.holidays.xconnect-MarketingAutomationService"
$indexServiceName = "sc.holidays.xconnect-IndexWorker"
$processingEngineServiceName = "sc.holidays.xconnect-ProcessingEngineService"
$excludePatterns  = @("*ConnectionStrings.config", "*license.xml", "*Sitecore.IdentityServer.Host.xml")
$sitecoreIisFolder = "C:\inetpub\wwwroot\sc.holidays.local"
$xconnectIisFolder = "C:\inetpub\wwwroot\sc.holidays.xconnect"
$xconnectModel = $xconnectIisFolder + "\App_Data\Models\Sitecore.XConnect.Collection.Model, 10.2.json"
$identityServerIisFolder = "C:\inetpub\wwwroot\sc.holidays.identityserver"

# Imports
Add-Type -AssemblyName System.IO.Compression.FileSystem
Import-Module WebAdministration

# Functions
function Copy-FilesWithExclusion {
    param (
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,

        [Parameter(Mandatory = $true)]
        [string]$DestinationPath,

        [Parameter(Mandatory = $true)]
        [string[]]$ExcludePatterns
    )

    # Get all files from the source path excluding the specified patterns
    $filesToCopy = Get-ChildItem -Path $SourcePath -Recurse -File | Where-Object {
        $include = $true
        foreach ($pattern in $ExcludePatterns) {
            if ($_.Name -like $pattern) {
                $include = $false
                break
            }
        }
        $include
    }

    # Create the destination directory if it doesn't exist
    if (-Not (Test-Path -Path $DestinationPath)) {
        New-Item -Path $DestinationPath -ItemType Directory | Out-Null
    }

    # Copy the files to the destination
    foreach ($file in $filesToCopy) {
        $destinationFile = Join-Path -Path $DestinationPath -ChildPath $file.FullName.Substring($SourcePath.Length).TrimStart("\")
        $destinationDir = Split-Path -Path $destinationFile -Parent
        if (-Not (Test-Path -Path $destinationDir)) {
            New-Item -Path $destinationDir -ItemType Directory | Out-Null
        }
        Copy-Item -Path $file.FullName -Destination $destinationFile
        Write-Output "Copied $($file.FullName) to $destinationFile"
    }
}

# Execution
Write-Output "Installing SPE 6.4"
Install-Module -Name SPE -RequiredVersion 6.4.0
Write-Output "Installing SPE 6.4 complete"

Write-Output "Installing .net6 Hosting Bundle"
& "$PSScriptRoot\dotnet6-hosting-bundle.ps1"
Write-Output "Installing .net6 Hosting Bundle complete"

#Stop iis
iisreset /stop

#stop xconnect services
$MAService = Get-Service -Name $MAServiceName
if ($MAService -and $MAService.Status -eq 'Running') {
    Stop-Service -Name $MAServiceName -Force
    Write-Output "The service '$MAServiceName' has been stopped."
}
$indexService = Get-Service -Name $indexServiceName
if ($indexService -and $indexService.Status -eq 'Running') {
    Stop-Service -Name $indexServiceName -Force
    Write-Output "The service '$indexServiceName' has been stopped."
}
$processingEngineService = Get-Service -Name $processingEngineServiceName
if ($processingEngineService -and $processingEngineService.Status -eq 'Running') {
    Stop-Service -Name $processingEngineServiceName -Force
    Write-Output "The service '$processingEngineServiceName' has been stopped."
}

# Check if the sitecore zip file already exists
if (Test-Path $zipFilePath) {
    Write-Output "The file already exists at $zipFilePath."
} else {
    # Download the ZIP file
    Write-Output "Downloading the file from $zipUrl..."
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFilePath
    Write-Output "Download complete."
}

# Create necessary folders
if (-Not (Test-Path $zipFolder)) {
    New-Item -ItemType Directory -Path $zipFolder | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipFilePath, $zipFolder)
    Write-Output "Created directory $zipFolder."
}
if (-Not (Test-Path $sitecoreUpgradeZipFolder)) {
    New-Item -ItemType Directory -Path $sitecoreUpgradeZipFolder | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory($sitecoreUpgradePackage, $sitecoreUpgradeZipFolder)
    Write-Output "Created directory $sitecoreUpgradeZipFolder."
}
if (-Not (Test-Path $xconnectUpgradeZipFolder)) {
    New-Item -ItemType Directory -Path $xconnectUpgradeZipFolder | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory($xconnectUpgradePackage, $xconnectUpgradeZipFolder)
    Write-Output "Created directory $xconnectUpgradeZipFolder."
}
if (-Not (Test-Path $identityServerZipFolder)) {
    New-Item -ItemType Directory -Path $identityServerZipFolder | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory($identityServerServerPackage, $identityServerZipFolder)
    Write-Output "Created directory $identityServerZipFolder."
}


# Copy files
Write-Output "Copy files to $($sitecoreUpgradeWebsiteFolder)"
Copy-FilesWithExclusion -SourcePath $sitecoreUpgradeWebsiteFolder -DestinationPath $sitecoreIisFolder -ExcludePatterns $excludePatterns

Write-Output "Copy files to $($xconnectUpgradeWebsiteFolder)"
Copy-FilesWithExclusion -SourcePath $xconnectUpgradeWebsiteFolder -DestinationPath $xconnectIisFolder -ExcludePatterns $excludePatterns

Write-Output "Copy files to $($identityServerWebsiteFolder)"
Copy-FilesWithExclusion -SourcePath $identityServerWebsiteFolder -DestinationPath $identityServerIisFolder -ExcludePatterns $excludePatterns

# Cleanup
Remove-Item $xconnectModel -ErrorAction SilentlyContinue
Remove-Item $zipFilePath
Remove-Item $zipFolder -Recurse

#Start build script
Write-Output "Starting sitecore build script"
 Set-Location -Path ..\..\
.\build.ps1 -Target "_BuildDev"