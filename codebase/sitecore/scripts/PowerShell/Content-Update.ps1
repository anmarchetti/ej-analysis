function Content-Update {
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

    # Get list of already executed scripts
    Write-Host "Get list of already executed scripts"
    $attempt = 3
    $success = $false
    while ($attempt -gt 0 -and -not $success) {
        $executedScripts = Invoke-RemoteScript -Session $session -ScriptBlock {
            $item = Get-Item -Path "master:/sitecore/system/Modules/Update Scripts"
            if ($item -eq $null) {
                $null
            }
            else { 
                $item.Fields["Executed Scripts"].Value
            }
        }
        if ($executedScripts -eq $null) {
            Write-Host "executedScripts variable is null. Attempts left: $attempt"
            $success = $false
        }
        else {
            Write-Host "Get list of already executed scripts sucessfully"
            $success = $true
        }
        $attempt--
    }
    $executedScriptsIds = $executedScripts.Split("|")
    Write-Host "Total number of executed scripts: $($executedScriptsIds.length)"

    # Get list of non-recurrence scripts
    Write-Host "Get list of non-recurrence scripts"
    $attempt = 5
    $success = $false
    while ($attempt -gt 0 -and -not $success) {
        $scripts = Invoke-RemoteScript -Session $session -ScriptBlock {
            Get-ChildItem -path "master:/sitecore/system/Modules/PowerShell/Script Library/Content Sync" -Language "en" | Where { $_.TemplateID -eq "{DD22F1B3-BD87-4DB2-9E7D-F7A496888D43}" } | Select-Object -Property Script, ID, Name
        }
        if ($scripts.length -eq '') {
            Write-Host "could not find non-recurrence scripts. Attempts left: $attempt"
            $success = $false
        }
        else {
            Write-Host "Get list of non-recurrence scripts sucessfully"
            $success = $true
        }
        $attempt--
    }

    Write-Host "Total number of non-recurrence scripts: $($scripts.length)"

    # Get list of recurrence scripts
    Write-Host "Get list of recurrence scripts"
    $recurrenceScripts = Invoke-RemoteScript -Session $session -ScriptBlock {
        Get-ChildItem -path "master:/sitecore/system/Modules/PowerShell/Script Library/Content Sync/Recurrence" -Language "en" | Where { $_.TemplateID -eq "{DD22F1B3-BD87-4DB2-9E7D-F7A496888D43}" } | Select-Object -Property Script, ID, Name
    }
    Write-Host "Total number of recurrence scripts: $($recurrenceScripts.length)"

    # Execute non-recurrence scripts
    Write-Host "Executing non-recurrence scripts"
    if ($scripts -ne $null) {
        $scripts | ForEach-Object {
            $script = $_.Script
            $scriptId = $_.ID.ToString()
            $scriptName = $_.Name

            # Check if script was already executed
            if ($executedScriptsIds.Contains($scriptId)) {
                return 
            }

            # Create script block
            $scriptBlock = [scriptblock]::create(" 
            try {
                `$errorActionPreference = 'Stop';
                cd master:/sitecore/content
                $($script -join [environment]::newline) 

                `$item = (Get-Item -Path 'master:/sitecore/system/Modules/Update Scripts')

                `$item.Editing.BeginEdit()
                `$item.Fields[`"Executed Scripts`"].Value += ('|' + '$($scriptId)')
                `$item.Editing.EndEdit() | out-null
            } catch {
                `$nonRecurrenceException = '`nScript failed: ' + `$(`$_.Exception.Message)
                Write-Error -Exception `$nonRecurrenceException
            }");

            # Run script block
            Write-Host "Executing: $scriptName"
            try {
                $jobId = Invoke-RemoteScript -Session $session -ScriptBlock $scriptBlock -AsJob
                Wait-RemoteScriptSession -Session $session -Id $jobId -Delay 5
            }
            catch {
                Write-Error "Script failed: $($_.Exception.Message)" -ErrorAction Stop
            }
            Write-Host "Script successfully executed: $scriptName`n"
        }
    }

    # Execute recurrence scripts
    if ($recurrenceScripts -ne $null) {
        Write-Host "Executing recurrence scripts"
        $recurrenceScripts | ForEach-Object {
            $script = $_.Script
            $scriptId = $_.ID.ToString()
            $scriptName = $_.Name

            # Check if script was already executed
            if ($executedScripts.Split("|").Contains($scriptId)) {
                return 
            }

            # Create script block
            $scriptBlock = [scriptblock]::create(" 
            try {
                `$errorActionPreference = 'Stop';
                cd master:/sitecore/content
                $($script -join [environment]::newline) 
            } catch {
                `$recurrenceException = '`nScript failed: ' +`$(`$_.Exception.Message)
                Write-Error -Exception `$RecurrenceException
            }");

            # Run script block
            Write-Host "Executing: $scriptName"
            try {
                $jobId = Invoke-RemoteScript -Session $session -ScriptBlock $scriptBlock -AsJob
                Wait-RemoteScriptSession -Session $session -Id $jobId -Delay 5
            }
            catch {
                Write-Error "Script failed: $($_.Exception.Message)" -ErrorAction Stop
            }
            Write-Host "Script successfully executed: $scriptName`n"
        }
    }

    Stop-ScriptSession -Session $session
}
