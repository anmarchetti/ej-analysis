<#
.SYNOPSIS
    Aligns assembly binding redirects in the xConnect IIS site and its
    background-job hosts (Marketing Automation, Processing Engine, Index
    Worker) with the assembly versions actually present on disk in each
    folder.

.DESCRIPTION
    Each xConnect role ships its own copy of:
        Microsoft.Bcl.AsyncInterfaces
        System.Text.Encodings.Web
        System.Text.Json

    The xConnect IIS site (sc.holidays.collection / .collectionsearch / .ma)
    gets these DLLs from this repo's publish output, which - after the WP-818
    AWS SDK v4 upgrade - is at 8.0.0 / 8.0.0 / 8.0.6.

    The background-job subfolders under App_Data\jobs\continuous\* ship as
    part of the vanilla Sitecore 10.4 distribution and stay at 7.0.0 / 7.0.0
    / 6.0.10 unless explicitly overwritten - our package doesn't touch them.

    A version mismatch between the DLL on disk and the .config file's
    bindingRedirect newVersion throws FileLoadException at host startup
    regardless of direction. Inside the IndexWorker it surfaces as a
    misleading SerializationException because Sitecore's
    ConfigurationException type lacks a deserialization constructor and
    cross-AppDomain marshalling fails (known Sitecore bug).

    This script self-aligns: for each target package in each target .config
    file it reads the DLL actually on disk next to / under that .config and
    sets the binding redirect's newVersion (and the upper bound of
    oldVersion) to match. Folders that don't contain the DLL are skipped
    with a clear warning. This makes the script:
      - Idempotent (re-runs are no-ops once aligned).
      - Direction-agnostic (works for v7 -> v8 upgrades AND v8 -> v7 reverts,
        so it naturally undoes a prior overshoot like the WP-818 PostDeploy
        on the IndexWorker subfolder).
      - Safe to run on every role (silently skips where the DLL isn't shipped).

.PARAMETER XConnectIisFolder
    Root folder of the xConnect IIS site. Defaults to the dev-box convention
    used by this repo.

.EXAMPLE
    .\Update-XConnect-BindingRedirects.ps1

.EXAMPLE
    .\Update-XConnect-BindingRedirects.ps1 -XConnectIisFolder 'C:\inetpub\wwwroot\sc.holidays.collectionsearch'
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$XConnectIisFolder = 'C:\inetpub\wwwroot\sc.holidays.xconnect'
)

$ErrorActionPreference = 'Stop'

function Write-Info {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Message
    )

    Write-Output $Message
}

# Packages we align. PublicKeyToken pins which <dependentAssembly> node we
# touch (defence in depth: same simple name could in theory appear with a
# different public key token elsewhere in the config).
$Targets = @(
    [PSCustomObject]@{ Name = 'Microsoft.Bcl.AsyncInterfaces'; PublicKeyToken = 'cc7b13ffcd2ddd51' }
    [PSCustomObject]@{ Name = 'System.Text.Encodings.Web';     PublicKeyToken = 'cc7b13ffcd2ddd51' }
    [PSCustomObject]@{ Name = 'System.Text.Json';              PublicKeyToken = 'cc7b13ffcd2ddd51' }
)

$ConfigFiles = @(
    Join-Path $XConnectIisFolder 'Web.config'
    Join-Path $XConnectIisFolder 'App_Data\jobs\continuous\AutomationEngine\Sitecore.MAEngine.exe.config'
    Join-Path $XConnectIisFolder 'App_Data\jobs\continuous\ProcessingEngine\Sitecore.ProcessingEngine.exe.config'
    Join-Path $XConnectIisFolder 'App_Data\jobs\continuous\IndexWorker\Sitecore.XConnectSearchIndexer.exe.config'
)

# Counters surfaced in the summary so a single Octopus log shows what happened.
$script:Counts = [PSCustomObject]@{
    FilesInspected   = 0
    FilesMissing     = 0
    FilesUpdated     = 0
    FilesUnchanged   = 0
    RedirectsAligned = 0
    RedirectsAlready = 0
    RedirectsSkipped = 0
}

function Get-DllOnDiskVersion {
    [CmdletBinding()]
    param(
        [string]$ConfigFile,
        [string]$AssemblyName
    )

    # The CLR probes the .config file's directory and its ./bin subfolder
    # when resolving private assemblies. Mirror that probe order so we find
    # the DLL the runtime will actually load.
    $folder    = Split-Path $ConfigFile -Parent
    $binFolder = Join-Path $folder 'bin'

    $candidates = @(
        (Join-Path $folder    "$AssemblyName.dll")
        (Join-Path $binFolder "$AssemblyName.dll")
    )

    foreach ($p in $candidates) {
        if (Test-Path $p) {
            try {
                return [PSCustomObject]@{
                    Path    = $p
                    Version = [System.Reflection.AssemblyName]::GetAssemblyName($p).Version.ToString()
                }
            } catch {
                Write-Warning "Failed to read assembly metadata from '$p': $($_.Exception.Message)"
            }
        }
    }
    return $null
}

function Update-BindingRedirect {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [string]$Path,
        [PSCustomObject[]]$Targets
    )

    if (-not (Test-Path $Path)) {
        Write-Info "Skipped (not found): $Path"
        $script:Counts.FilesMissing++
        return
    }
    $script:Counts.FilesInspected++

    [xml]$doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $true
    $doc.Load($Path)

    $ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
    $ns.AddNamespace('asm', 'urn:schemas-microsoft-com:asm.v1')

    $changed = $false
    foreach ($t in $Targets) {
        $dll = Get-DllOnDiskVersion -ConfigFile $Path -AssemblyName $t.Name
        if (-not $dll) {
            Write-Warning "  - $($t.Name): no DLL on disk near $Path; leaving redirect untouched."
            $script:Counts.RedirectsSkipped++
            continue
        }

        $xpath = "//asm:dependentAssembly[asm:assemblyIdentity/@name='$($t.Name)' and asm:assemblyIdentity/@publicKeyToken='$($t.PublicKeyToken)']/asm:bindingRedirect"
        $node  = $doc.SelectSingleNode($xpath, $ns)
        if ($null -eq $node) {
            Write-Warning "  - $($t.Name): no <bindingRedirect> for this assembly in $Path."
            $script:Counts.RedirectsSkipped++
            continue
        }

        $targetNew  = $dll.Version
        $targetOld  = "0.0.0.0-$($dll.Version)"
        $currentOld = $node.GetAttribute('oldVersion')
        $currentNew = $node.GetAttribute('newVersion')

        if ($currentOld -eq $targetOld -and $currentNew -eq $targetNew) {
            Write-Output "  - $($t.Name): already aligned at $($dll.Version) (DLL: $($dll.Path))"
            $script:Counts.RedirectsAlready++
            continue
        }

        $node.SetAttribute('oldVersion', $targetOld)
        $node.SetAttribute('newVersion', $targetNew)
        Write-Output "  - $($t.Name): $currentOld / $currentNew -> $targetOld / $targetNew (matched DLL at $($dll.Path))"
        $script:Counts.RedirectsAligned++
        $changed = $true
    }

    if ($changed) {
        if ($PSCmdlet.ShouldProcess($Path, 'Align binding redirects to DLLs on disk')) {
            $doc.Save($Path)
            Write-Output "Saved: $Path"
            $script:Counts.FilesUpdated++
        }
    } else {
        $script:Counts.FilesUnchanged++
    }
}

Write-Output "Aligning xConnect binding redirects under '$XConnectIisFolder' to DLLs on disk..."
foreach ($file in $ConfigFiles) {
    Write-Output ""
    Write-Output $file
    Update-BindingRedirect -Path $file -Targets $Targets
}

Write-Output ""
Write-Output "Done. Summary:"
Write-Output ("  Files inspected:           {0}" -f $script:Counts.FilesInspected)
Write-Output ("  Files updated:             {0}" -f $script:Counts.FilesUpdated)
Write-Output ("  Files unchanged:           {0}" -f $script:Counts.FilesUnchanged)
Write-Output ("  Files missing:             {0}" -f $script:Counts.FilesMissing)
Write-Output ("  Redirects aligned:         {0}" -f $script:Counts.RedirectsAligned)
Write-Output ("  Redirects already correct: {0}" -f $script:Counts.RedirectsAlready)
Write-Output ("  Redirects skipped (no DLL): {0}" -f $script:Counts.RedirectsSkipped)
Write-Output ""
Write-Output "Restart the xConnect services and IIS app pool for changes to take effect."
