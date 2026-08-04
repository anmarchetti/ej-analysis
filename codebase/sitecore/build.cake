// Loading Cake Add-Ins and External Libraries
#addin nuget:?package=Cake.Powershell&version=1.0.1
#addin nuget:?package=Cake.Http&version=1.0.0
#addin nuget:?package=Cake.Services&version=1.0.1

#tool "nuget:?package=Xunit.Runner.Console&version=2.4.1"
#tool "nuget:?package=JetBrains.dotCover.CommandLineTools&version=2023.2.3"

// Loading Configuration and Helper Methods
#load local:?path=scripts/Cake/utilities.cake


// Loading Local Variables
#load local:?path=build.config.cake

// Initializing Local Variables
var configuration = new Configuration();


// Initializing Cake Execution Arguments 
var target = Argument<string>("Target", "_Build");

// Initializing Setup
Setup(context =>
{
    configuration.BuildToolVersion = Argument<string>("BuildToolVersion", configuration.BuildToolVersion);
    configuration.BuildConfiguration = Argument<string>("BuildConfiguration", configuration.BuildConfiguration);
    configuration.ContentFolder = Argument<string>("ContentFolder", configuration.ContentFolder);
    configuration.PublishingFolder = Argument<string>("PublishingFolder", configuration.PublishingFolder);
    configuration.XConnectPublishFolder = Argument<string>("XConnectPublishFolder", configuration.XConnectPublishFolder);
    configuration.XConnectJobsPublishFolder = Argument<string>("XConnectJobsPublishFolder", configuration.XConnectJobsPublishFolder);
    configuration.XConnectProcessingEnginePublishFolder = Argument<string>("XConnectProcessingEnginePublishFolder", configuration.XConnectProcessingEnginePublishFolder);
    configuration.XConnectModelsPublishFolder = Argument<string>("XConnectModelsPublishFolder", configuration.XConnectModelsPublishFolder);
    configuration.XConnectIndexWorkerPublishFolder = Argument<string>("XConnectIndexWorkerPublishFolder", configuration.XConnectIndexWorkerPublishFolder);
    configuration.UseLocalNugetPackages = Argument<bool>("UseLocalNugetPackages", configuration.UseLocalNugetPackages);
    configuration.TrackerApiXConnectLibsFolderPath = Argument<string>("TrackerApiXConnectLibsFolderPath", configuration.TrackerApiXConnectLibsFolderPath);

    Information("Build is running under the following configuration:");
    Information($"Build Tool Version: {configuration.BuildToolVersion}");
    Information($"Build Configuration: {configuration.BuildConfiguration}");
    Information($"Content Folder: {configuration.ContentFolder}");
    Information($"Publishing Folder: {configuration.PublishingFolder}");
    Information($"XConnectPublish Folder: {configuration.XConnectPublishFolder}");
    Information($"XConnectJobsPublish Folder: {configuration.XConnectJobsPublishFolder}");
    Information($"XConnectProcessingEnginePublish Folder: {configuration.XConnectProcessingEnginePublishFolder}");
    Information($"XConnectModelsPublish Folder: {configuration.XConnectModelsPublishFolder}");
    Information($"XConnectIndexWorkerPublish Folder: {configuration.XConnectIndexWorkerPublishFolder}");
    Information($"Use Local Nuget Packages: {configuration.UseLocalNugetPackages}");
    Information($"TrackerApiXConnectLibs Folder Path: {configuration.TrackerApiXConnectLibsFolderPath}");
});

// Task: Restore-NuGet-Packages
Task("Restore-NuGet-Packages")
.Does(() => 
{
    Information($"Restoring NuGet Packages for solution: {configuration.SolutionName}");

    var nuSettigns = new NuGetRestoreSettings { NoCache = true, ToolPath = "./tools/nuget.exe" };
    if (configuration.UseLocalNugetPackages) {
        nuSettigns.Source = new List<string> { "C:\\Windows\\system32\\config\\systemprofile\\.nuget\\packages" };
    }

    NuGetRestore(configuration.SolutionName, nuSettigns);
});

// Task: Create-Sonarqube-Exclusions
Task("Create-Sonarqube-Exclusions")
.Does(()=> 
{
	Information($"Create Sonarqube Exclusions: {configuration.SolutionName}");
	StartPowershellFile($"./SonarQube-Exclude.ps1");
});

// Task: Clean-Solution
Task("Clean-Solution")
.Does(() => 
{
    Information($"Cleaning solution: {configuration.SolutionName}");
    CleanDirectories($"{configuration.SolutionFolder}/**/obj");
    CleanDirectories($"{configuration.SolutionFolder}/**/bin");

});


// Task: Build Solution
Task("Build-Solution")
.Does(() => 
{
    Information($"Building solution: {configuration.SolutionName}");
    MSBuild(configuration.SolutionName, settings => InitializeMSBuildSettings(settings));
});


// Task: Publish-All-Projects
Task("Publish-All-Projects")
  .IsDependentOn("Publish-Foundation-Projects")
  .IsDependentOn("Publish-Feature-Projects")
  .IsDependentOn("Publish-Project-Projects");


// Task: Clean publish folder
Task("Clean-Publish-Folder")
.ContinueOnError()
.Does(() => 
{
    CleanSitecore();
});


//Task: Publish Solution
Task("Publish-Solution")
.Does(() => 
{
    PublishSolution(configuration.SolutionName);
});

// Task: Publish-Foundation-Projects
Task("Publish-Foundation-Projects")
.Does(() => 
{
    var foundationSolutionFolder = $@"{configuration.SolutionFolder}\Foundation";
    PublishProjects(foundationSolutionFolder);
});

// Task: Publish-Feature-Projects
Task("Publish-Feature-Projects")
.Does(() => 
{
    var featureSolutionFolder = $@"{configuration.SolutionFolder}\Feature";
    PublishProjects(featureSolutionFolder);
});

// Task: Publish-Project-Projects
Task("Publish-Project-Projects")
.Does(() => 
{
    var projectSolutionFolder = $@"{configuration.SolutionFolder}\Project";
    PublishProjects(projectSolutionFolder);
});

// Task: Publish-XConnect-Artifacts
Task("Publish-XConnect-Artifacts")
.Does(() => {
    PublishXConnectProjects();
    PublishXConnectJobs();
    PublishProcessEngine();
    PublishXConnectModels();
    PublishXConnectJobsToTrackerApi();
});

// Task: Patch-XConnect-BindingRedirects
// Sitecore 10.x ships the xConnect IIS site and its background-job hosts
// (MA, Processing Engine, Index Worker) with binding redirects pinned to
// older versions of Microsoft.Bcl.AsyncInterfaces / System.Text.Encodings.Web
// / System.Text.Json (typically 7.0.0 / 7.0.0 / 6.0.10). WP-818 forces those
// packages up to 8.0.0 / 8.0.0 / 8.0.6 to satisfy AWSSDK v4, and the Publish-
// XConnect-Artifacts step above overwrites the deployed DLLs accordingly. This
// task realigns the stock exe.config/web.config redirects so the hosts can
// load the new assemblies. The script is idempotent and a no-op once applied.
//
// Scope: dev boxes / local Sitecore installs only. On CI the xConnect package
// is a delta and does not contain a Web.config for the script to find, so this
// task is effectively a no-op there. The equivalent deploy-target fix is the
// Octopus PostDeploy hook shipped by Copy-XConnect-Octopus-Hooks below; the
// same Update-XConnect-BindingRedirects.ps1 then runs against the install
// directory on every target server, in every environment, with no per-step
// configuration in Octopus.
Task("Patch-XConnect-BindingRedirects")
.Does(() => {
    StartPowershellFile($"./scripts/PowerShell/Update-XConnect-BindingRedirects.ps1",
        new PowershellSettings()
            .SetFormatOutput()
            .SetLogOutput()
            .WithArguments(args =>
            {
                args.Append("XConnectIisFolder", configuration.XConnectPublishFolder);
            }
        )
    );
});

// Task: Copy-XConnect-Octopus-Hooks
// Ships the WP-818 binding-redirect patch into the Octopus package so it runs
// automatically on every target, in every environment, with no project-side
// configuration in Octopus.
//
// Octopus has a built-in convention: any PostDeploy.ps1 found at the root of
// a deployed package is executed by the Tentacle after the file copy step and
// before subsequent deploy actions (including the Check-Xconnect health check
// configured in the deploy step). Our PostDeploy.ps1 invokes the patching
// logic in Update-XConnect-BindingRedirects.ps1 against the destination
// directory, rewriting Web.config (and the engine *.exe.config files where
// they exist on that role) to point at the 8.0.0/8.0.6 DLLs we actually
// deploy.
//
// Both files are copied into XConnectPublishFolder so they end up at the
// package root: that is the directory Octopus extracts the package into, and
// it is where the PostDeploy.ps1 convention requires the script to live. The
// helper script's $PSScriptRoot resolves to that same folder, which is how
// PostDeploy.ps1 locates Update-XConnect-BindingRedirects.ps1 at runtime.
Task("Copy-XConnect-Octopus-Hooks")
.Does(() => {
    var dst = configuration.XConnectPublishFolder;
    var hooks = new [] {
        "./deploy/xconnect/PostDeploy.ps1",
        "./scripts/PowerShell/Update-XConnect-BindingRedirects.ps1"
    };
    CreateFolder(dst);
    foreach (var src in hooks) {
        Information($"Copying Octopus hook: {src} -> {dst}");
        CopyFileToDirectory(src, dst);
    }
});

// Task: Publish-All-Configs
Task("Publish-All-Configs")
.Does(() => 
{
    var filesFilter = $@"{configuration.SolutionFolder}\**\App_Config\**\*.config";
    var destination = $@"{configuration.PublishingFolder}\App_Config";
    
    CreateFolder(destination);
    CopyFilesToAppConfigFolder(filesFilter, destination);
});

// Task: Cleanup-Artifacts
Task("Cleanup-Projects-Artifacts")
.Does(() => 
{
    var files = GetFiles($@"{configuration.PublishingFolder}\bin\Sitecore.*.dll");
    DeleteFiles(files);
});


// Task: Modify-Unicorn-Settings
Task("Modify-Unicorn-Settings")
.Does(() => 
{
    var zDevSettingsFile = File($"{configuration.PublishingFolder}/App_config/Include/zDevSettings.config");

    Information($"Modifying file: {zDevSettingsFile}");

	var rootXPath = "configuration/sitecore/sc.variable[@name='{0}']/@value";
    var sourceFolderXPath = string.Format(rootXPath, "sourceFolder");
    var directoryPath = MakeAbsolute(new DirectoryPath(configuration.SolutionFolder)).FullPath;

    var xmlSetting = new XmlPokeSettings 
    {
        Namespaces = new Dictionary<string, string> 
        {
            {"patch", @"http://www.sitecore.net/xmlconfig/"}
        }
    };
    XmlPoke(zDevSettingsFile, sourceFolderXPath, directoryPath, xmlSetting);
});


// Task: Copy-Unicorn-Files
 Task("Copy-Unicorn-Files")
.Does(()=> 
{
    var filesFilter = $@"{configuration.SolutionFolder}\**\*.yml";
    var destination = $@"{configuration.ContentFolder}\Unicorn";
    
    CreateFolder(destination);
    CopyFilesToFolder(filesFilter, destination);
});


// Task: Copy-Unicorn-Scripts
Task("Copy-Unicorn-Scripts")
.Does(()=> 
{
    var filesFilter = $@".\scripts\Unicorn\*";
    var destination = $@"{configuration.ContentFolder}\Scripts\Unicorn";

    CreateFolder(destination);
    CopyFilesToFolder(filesFilter, destination);

});

// Task: Copy-Content-Update-Script
Task("Copy-Content-Update-Script")
.Does(()=> 
{
    var filesFilter = $@".\scripts\PowerShell\Content-Update.ps1";
    var destination = $@"{configuration.ContentFolder}\Scripts";

    CreateFolder(destination);
    CopyFilesToFolder(filesFilter, destination);

});

// Task: Sync-Content
Task("Sync-Content")
.Does(()=> 
{
    StartPowershellScript(@"Import-Module .\scripts\PowerShell\Content-Update.ps1; Content-Update");
});

// Task: Delete-Publish-All-Items
Task("Delete-Publish-All-Items")
.ContinueOnError()
.Does(()=> 
{
    StartPowershellScript(@"Import-Module .\scripts\PowerShell\Delete-Publish-All-Items.ps1; Delete-Publish-All-Items");
});

// Task: Sync-Unicorn
Task("Sync-Unicorn")
.Does(() => 
{
    var unicornUrl = "https://" + configuration.WebsiteName + "/unicorn.aspx";
    Information("Syncronizing Unicorn Items: " + unicornUrl);

    var authenticationFile = new FilePath($"{configuration.PublishingFolder}/App_config/Include/Unicorn/Unicorn.SharedSecret.config");
    var xPath = "/configuration/sitecore/unicorn/authenticationProvider/SharedSecret";
    
    string sharedSecret = XmlPeek(authenticationFile, xPath);

    StartPowershellFile($"./scripts/Unicorn/Sync.ps1", 
        new PowershellSettings()
            .SetFormatOutput()
            .SetLogOutput()
            .WithArguments(args => 
            {
                args
                    .Append("secret", sharedSecret)
                    .Append("url", unicornUrl);
            }
        )
    );
});

Task("Rebuild-Destinations-Master-Index").Does(() => {
    RebuildIndex("sitecore_destinations_master_index");
});

// Task: Run-Unit-Tests
Task("Run-Unit-Tests")
.IsDependentOn("Restore-NuGet-Packages")
//.IsDependentOn("Clean-Solution")
.IsDependentOn("Build-Solution")
.Does(() =>
{
    Information($"Running unit tests for solution: {configuration.SolutionName}");

    DotCoverAnalyse(tool => {
      tool.XUnit2($@"{configuration.SolutionFolder}\**\tests\bin\{configuration.BuildConfiguration}\*.Tests.dll",
        new XUnit2Settings {
        });
      },
      new FilePath($@"{configuration.PublishingFolder}\App_Data\TestResults\dotCover.html"),
      new DotCoverAnalyseSettings() {
        ReportType = DotCoverReportType.HTML
      });

    // XUnit2($@"{configuration.SolutionFolder}\**\tests\bin\{configuration.BuildConfiguration}\*.Tests.dll", new XUnit2Settings 
    // {
    //  XmlReport = false,
	// 	OutputDirectory = $@"{configuration.PublishingFolder}\App_Data\TestResults"
    // }); 
});


Task("Stop-Services").Does(() => {
    StopService("sc.holidays.xconnect-MarketingAutomationService");
    StopService("sc.holidays.xconnect-ProcessingEngineService");
});

Task("Start-Services").Does(() => {
    StartService("sc.holidays.xconnect-MarketingAutomationService");
    StartService("sc.holidays.xconnect-ProcessingEngineService");
});

// Task: Build - Sequential Tasks
Task("_Build")
.WithCriteria(configuration != null)
.IsDependentOn("Stop-Services")
.IsDependentOn("Clean-Publish-Folder")
.IsDependentOn("Clean-Solution")
.IsDependentOn("Create-Sonarqube-Exclusions")
.IsDependentOn("Restore-NuGet-Packages")
.IsDependentOn("Build-Solution")
.IsDependentOn("Publish-Solution")
//.IsDependentOn("Publish-All-Projects")
.IsDependentOn("Publish-XConnect-Artifacts")
.IsDependentOn("Patch-XConnect-BindingRedirects")
.IsDependentOn("Modify-Unicorn-Settings")
.IsDependentOn("Sync-Unicorn")
.IsDependentOn("Delete-Publish-All-Items")
.IsDependentOn("Sync-Content")
//.IsDependentOn("Rebuild-Destinations-Master-Index")
.IsDependentOn("Start-Services");


Task("_Release")
.WithCriteria(configuration != null)
.IsDependentOn("Clean-Publish-Folder")
.IsDependentOn("Clean-Solution")
.IsDependentOn("Restore-NuGet-Packages")
.IsDependentOn("Build-Solution")
//.IsDependentOn("Run-Unit-Tests")
//.IsDependentOn("Publish-All-Projects")
.IsDependentOn("Publish-Solution")
//.IsDependentOn("Cleanup-Projects-Artifacts")
.IsDependentOn("Publish-XConnect-Artifacts")
.IsDependentOn("Patch-XConnect-BindingRedirects")
.IsDependentOn("Copy-XConnect-Octopus-Hooks");

Task("_Content")
.WithCriteria(configuration != null)
.IsDependentOn("Copy-Unicorn-Scripts")
.IsDependentOn("Copy-Unicorn-Files")
.IsDependentOn("Copy-Content-Update-Script");


Task("_BuildDev")
.WithCriteria(configuration != null)
.IsDependentOn("Stop-Services")
.IsDependentOn("Clean-Publish-Folder")
.IsDependentOn("Clean-Solution")
.IsDependentOn("Create-Sonarqube-Exclusions")
.IsDependentOn("Restore-NuGet-Packages")
.IsDependentOn("Build-Solution")
.IsDependentOn("Publish-Solution")
//.IsDependentOn("Publish-All-Projects")
.IsDependentOn("Publish-XConnect-Artifacts")
.IsDependentOn("Patch-XConnect-BindingRedirects")
.IsDependentOn("Modify-Unicorn-Settings")
.IsDependentOn("Start-Services");

// Run Target Task
RunTarget(target);