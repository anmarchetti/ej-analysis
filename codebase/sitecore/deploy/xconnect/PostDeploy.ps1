<#
.SYNOPSIS
    Octopus PostDeploy hook: aligns the xConnect role's assembly binding
    redirects with the BCL DLL versions actually present on disk after Octopus
    finishes copying our package.

.DESCRIPTION
    Octopus auto-runs any PostDeploy.ps1 it finds at the root of a deployed
    package, on every target the package lands on, in every environment. The
    behaviour requires no project-side configuration in Octopus -- the fix is
    self-contained in the artefact.

    Sitecore 10.x deposits xConnect role Web.config files (and the engine
    *.exe.config files where applicable) with binding redirects pinned to the
    stock Sitecore baseline:

        Microsoft.Bcl.AsyncInterfaces  7.0.0.0
        System.Text.Encodings.Web      7.0.0.0
        System.Text.Json               6.0.0.10

    WP-818 (AWS SDK v4) raises those packages to 8.0.0 / 8.0.0 / 8.0.6 via
    transitive NuGet dependencies. Octopus copies the new DLLs into the IIS
    site root (so the IIS site's ./bin folder ends up at v8), but our package
    does NOT ship a Web.config, nor does it ship BCL DLLs into the
    App_Data\jobs\continuous\*\ subfolders. As a result those subfolders keep
    their Sitecore-baseline v7 / v6.10 DLLs.

    A statically-pinned "patch every config to v8" approach therefore aligns
    the IIS-level Web.config correctly but breaks the IndexWorker / engine
    subfolders, whose .exe.config files would then point at v8 DLLs that don't
    exist in their folder. The CLR throws FileLoadException either way; inside
    the IndexWorker that surfaces as a misleading SerializationException
    because Sitecore's ConfigurationException can't be marshalled across
    AppDomains.

    The companion script Update-XConnect-BindingRedirects.ps1 therefore self-
    aligns: per .config file, per target assembly, it reads the DLL on disk
    next to (or under ./bin of) that .config and sets the binding redirect's
    newVersion to match. Folders without the DLL are left alone. This means:
      - The IIS-level Web.config picks up v8 (forward fix for WP-818).
      - The engine subfolders keep v7 / v6.10 because that's what's on disk.
      - The script is idempotent and direction-agnostic; re-runs are no-ops.

    The companion script ships alongside this file in the package root; the
    Cake task Copy-XConnect-Octopus-Hooks is responsible for putting both
    files there during _Release.

    Targets per role:
        Web.config
        App_Data\jobs\continuous\AutomationEngine\Sitecore.MAEngine.exe.config
        App_Data\jobs\continuous\ProcessingEngine\Sitecore.ProcessingEngine.exe.config
        App_Data\jobs\continuous\IndexWorker\Sitecore.XConnectSearchIndexer.exe.config
    Missing paths are skipped with a warning. A scaled-topology Collection
    role server, for example, only has Web.config; an MA-Engine role server
    will have Web.config plus its own Sitecore.MAEngine.exe.config.

.NOTES
    Failures here halt the deployment (Octopus treats a non-zero exit from
    PostDeploy.ps1 as a failed step). That is intentional: we would rather
    block the deploy than leave the IIS site in a state where Application_Start
    will throw FileLoadException as soon as a request comes in.
#>

$ErrorActionPreference = 'Stop'

$installDir = $OctopusParameters['Octopus.Action.Package.InstallationDirectoryPath']
if ([string]::IsNullOrWhiteSpace($installDir)) {
    throw "PostDeploy.ps1: Octopus.Action.Package.InstallationDirectoryPath is empty -- this script must be auto-invoked by Octopus, not run interactively."
}

Write-Host "WP-818 PostDeploy hook: aligning xConnect binding redirects to DLLs on disk under '$installDir'."

$patchScript = Join-Path $PSScriptRoot 'Update-XConnect-BindingRedirects.ps1'
if (-not (Test-Path $patchScript)) {
    throw "PostDeploy.ps1: companion script not found at '$patchScript'. Verify the Cake task Copy-XConnect-Octopus-Hooks shipped it alongside this file."
}

& $patchScript -XConnectIisFolder $installDir
