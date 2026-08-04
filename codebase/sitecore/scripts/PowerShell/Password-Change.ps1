<#
.SYNOPSIS

Change password of sitecore user.

.DESCRIPTION

Set new password for sitecore user.

.PARAMETER Username
Sitecore user name.
Local Name
    Example: admin
Fully Qualified Name
    Example: sitecore\admin

.PARAMETER OldPassword
Old password user.
Example: qwerty_0    

.PARAMETER NewPassword
New password value.
Example: newqwerty_0

.PARAMETER Url
Sitecore CM url value.
Example: newqwerty_0

.OUTPUTS

Modified sitecore user with new password.

.EXAMPLE
For sitecore directory -> scripts\PowerShell:
PS> .\Password-Change.ps1 -Username admin -OldPassword b -NewPassword pass123 -Url "http://sc.holidays.local"  
#>
[CmdletBinding()]
Param(
    [Parameter(Mandatory=$true)]
    [string]$Username,

    [Parameter(Mandatory=$true)]
    [string]$OldPassword,

    [Parameter(Mandatory=$true)]
    [string]$NewPassword,

    [Parameter(Mandatory=$true)]
    [string]$Url
)

$env:PSModulePath=$env:PSModulePath + ";" + "$psscriptroot\Modules"
Import-Module -Name SPE -Force -DisableNameChecking

# Connect to Sitecore 
$session = New-ScriptSession -Username $Username -Password $OldPassword -ConnectionUri $Url -Timeout 1800000 # 30 min

Invoke-RemoteScript -Session $session -ScriptBlock {
    # Change password for user    
    Set-UserPassword -Identity $using:Username -NewPassword $using:NewPassword -Reset
}

Stop-ScriptSession -Session $session
