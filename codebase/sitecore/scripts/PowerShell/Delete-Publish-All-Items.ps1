function Delete-Publish-All-Items {
    [CmdletBinding()]
    param (
        [string] $User = "admin",
        [string] $Password = "SIF-Default",
        [string] $Url = "https://sc.holidays.local"
    )
    
    #Set-ExecutionPolicy -ExecutionPolicy ByPass
    $env:PSModulePath = $env:PSModulePath + ";" + "$psscriptroot\Modules"
    Import-Module -Name SPE -Force -DisableNameChecking

    #Set the system variable to Stop if the script failed
    $ErrorActionPreference = "Stop"

    # Powershell TLS fix (enable TLS 1.1 and TLS 1.2)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls12

    # Connect to Sitecore
    Write-Host "Connect to Sitecore"
    $session = New-ScriptSession -Username $user -Password $password -ConnectionUri $url -Timeout 1800 # 30 min

    # Delete Publish All Items
    Write-Host "Delete Publish All Items"
    Invoke-RemoteScript -Session $session -ScriptBlock {
        Get-Item -Path "master:/sitecore/system/Modules/PowerShell/Script Library/Content Sync/Recurrence/Publish All Items" -ErrorAction SilentlyContinue | Remove-Item -Force -Permanently # Use only in Development
    }
    Stop-ScriptSession -Session $session
}
