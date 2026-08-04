using System.Text.RegularExpressions;

// Get Valid MSBuildToolVersion based on Configuration BuildToolVersion
public MSBuildToolVersion GetValidMSBuildToolVersion()
{
    var msBuildToolVersion = MSBuildToolVersion.Default;
    if(Enum.TryParse(configuration.BuildToolVersion, out msBuildToolVersion)) 
    {
        return msBuildToolVersion;
    }
    else
    {
        return MSBuildToolVersion.Default;
    }
}

// Initialize MSBuild Settings from Configuration Object
public MSBuildSettings InitializeMSBuildSettings(MSBuildSettings settings)
{
    settings.SetConfiguration(configuration.BuildConfiguration)
            .SetVerbosity(Verbosity.Minimal)
            .SetMSBuildPlatform(MSBuildPlatform.Automatic)
            .SetPlatformTarget(PlatformTarget.MSIL)
            .UseToolVersion(GetValidMSBuildToolVersion())
			.SetMaxCpuCount(0)
            .WithProperty("StyleCopEnabled", "false")
            .WithRestore();

    return settings;
}

// Initialize Globber Settings with Exclude Predicate
public GlobberSettings InitializeGlobberSettings()
{
    Func<IFileSystemInfo, bool> filesToExclude = x => !x.Path.FullPath.Contains("/obj/") && !x.Path.FullPath.Contains("/bin/");
    return new GlobberSettings { Predicate = filesToExclude };
}

// Publish Projects from specific Root Folder
public void PublishProjects(string layerFolder)
{
    var projects = GetFiles($@"{layerFolder}\**\code\*.csproj");
    foreach (var project in projects)
    {
        Information($"Publishing project: {project.GetFilename()}");
        MSBuild(project, settings => InitializeMSBuildSettings(settings)
        .WithTarget("Build")
        .WithProperty("PublishUrl", configuration.PublishingFolder)
        .WithProperty("DeployOnBuild", "true")
        .WithProperty("DeployDefaultTarget", "WebPublish")
        .WithProperty("WebPublishMethod", "FileSystem")
        .WithProperty("DeleteExistingFiles", "false")
        .WithProperty("BuildProjectReferences", "false"));
    }
}

// Publish Solution
public void PublishSolution(string solutionName)
{
        Information($"Publishing solution: {solutionName}");
        MSBuild(solutionName, settings => InitializeMSBuildSettings(settings)
        .WithTarget("Build")
        .WithProperty("PublishUrl", configuration.PublishingFolder)
        .WithProperty("DeployOnBuild", "true")
        .WithProperty("DeployDefaultTarget", "WebPublish")
        .WithProperty("WebPublishMethod", "FileSystem")
        .WithProperty("DeleteExistingFiles", "false")
        .WithProperty("BuildProjectReferences", "false"));
}


// Publish XConnect Projects from specific Root Folder
public void PublishXConnectProjects()
{
    var projects = GetFiles($@"{configuration.SolutionFolder}\Foundation\xconnect\code\*.csproj");
   
    foreach (var project in projects)
    {
        Information($"Publishing XConnect project: {project.GetFilename()}");
        MSBuild(project, settings => InitializeMSBuildSettings(settings)
        .WithTarget("Build")
        .WithProperty("PublishUrl", configuration.XConnectPublishFolder)
        .WithProperty("DeployOnBuild", "true")
        .WithProperty("DeployDefaultTarget", "WebPublish")
        .WithProperty("WebPublishMethod", "FileSystem")
        .WithProperty("DeleteExistingFiles", "false")
        .WithProperty("BuildProjectReferences", "false"));
    }
	
	var dllFilter = $@"{configuration.XConnectPublishFolder}\bin\*.dll";
	var excludedDlls = new [] { "Sitecore.Services.Infrastructure.dll" };
	DeleteUnwantedDllFiles(dllFilter, excludedDlls);
}

public void PublishXConnectModels(){
    var projectsModelsFilter = $@"{configuration.SolutionFolder}\Foundation\XConnect\code\App_Data\Models\*.json";  
    
    Information($"Publishing XConnect models: {configuration.XConnectModelsPublishFolder}");
    CreateFolder(configuration.XConnectModelsPublishFolder);
    CopyFilesToFolder(projectsModelsFilter, configuration.XConnectModelsPublishFolder);

    Information($"Publishing XConnect index worker models: {configuration.XConnectIndexWorkerPublishFolder}");    
    CreateFolder(configuration.XConnectIndexWorkerPublishFolder);
    CopyFilesToFolder(projectsModelsFilter, configuration.XConnectIndexWorkerPublishFolder);
}

public void PublishXConnectJobs(){
    var projectsDllFilter = $@"{configuration.SolutionFolder}\Foundation\XConnect\code\bin\*.dll";
    var excludedDlls = new [] { "Sitecore.Services.Infrastructure.dll" };
    Information($"Publishing XConnect job: {configuration.XConnectJobsPublishFolder}");
    CreateFolder(configuration.XConnectJobsPublishFolder);
    CopyFilesToFolder(projectsDllFilter, configuration.XConnectJobsPublishFolder, excludedDlls);
}

public void PublishProcessEngine(){
    var projectsDllFilter = $@"{configuration.SolutionFolder}\Foundation\XConnect\code\bin\*.dll";
  var excludedDlls = new [] { "Sitecore.Services.Infrastructure.dll" };
    Information($"Publishing XConnect job: {configuration.XConnectProcessingEnginePublishFolder}");
    CreateFolder(configuration.XConnectProcessingEnginePublishFolder);
    CopyFilesToFolder(projectsDllFilter, configuration.XConnectProcessingEnginePublishFolder, excludedDlls);
}

public void PublishXConnectJobsToTrackerApi() {    
    var xConnectDllsFilter = $@"{configuration.SolutionFolder}\Foundation\XConnect\code\bin\easyJet.*.dll";
    var excludedDlls = new [] { "Sitecore.Services.Infrastructure.dll" };
    var directoryPath = MakeAbsolute(new DirectoryPath(configuration.TrackerApiXConnectLibsFolderPath)).FullPath;
    Information($"Publishing XConnectJobs To TrackerApi: {directoryPath}");
    CreateFolder(directoryPath);
    CopyFilesToFolder(xConnectDllsFilter, directoryPath, excludedDlls);
}

// Check if Exists and Create Directory
public void CreateFolder(string folderPath)
{
    if (!DirectoryExists(folderPath))
    {
        CreateDirectory(folderPath);
    }
}

// Copy Files to Folder
public void CopyFilesToFolder(
    string filesFilter,
    string destination,
    IEnumerable<string> excludedDlls = null)
{
    var globSettings = InitializeGlobberSettings();

    // Normalize exclusion list (empty = no exclusions)
    var excludeSet = excludedDlls == null
        ? new HashSet<string>()
        : new HashSet<string>(
            excludedDlls.Select(x => x.ToLowerInvariant())
          );

    var files = GetFiles(filesFilter, globSettings)
        .Where(file =>
        {
            // If no exclusions, copy everything
            if (excludeSet.Count == 0)
                return true;

            var fileName = file.GetFilename().ToString().ToLowerInvariant();

            // Copy if:
            // - it's not a DLL, OR
            // - it's a DLL but NOT in the exclusion set
            return !fileName.EndsWith(".dll") || !excludeSet.Contains(fileName);
        })
        .ToList();

    if (!files.Any())
    {
        Information("No files to copy after applying exclusions.");
        return;
    }

    foreach (var f in files)
        Information($"Copying: {f.FullPath}");

    CopyFiles(files, destination, preserveFolderStructure: true);
}

// Copy Files to Folder
public void CopyFilesToAppConfigFolder(string filesFilter, string destination)
{
    var files = GetFiles(filesFilter, InitializeGlobberSettings()).ToList();

    foreach(var file in files)
    {
        Information($"Copying file: {file.FullPath}");

        var destinationFileRegex = Regex.Replace(file.FullPath, $".+App_Config/(.+)/*", "$1");
        FilePath destinationFile = $@"{destination}\{destinationFileRegex.Replace("/", "\\")}";

        CreateFolder(destinationFile.GetDirectory().FullPath);
        CopyFile(file.FullPath, destinationFile);  
    }
}

//Rebuild provided Index
public void RebuildIndex(string indexName)
{
    var url = $"https://{configuration.WebsiteName}/api/utilities/indexrebuild?indexName={indexName}";
    Console.WriteLine("URL: " + url);
    string responseBody = HttpGet(url);
}

public void CleanSitecore()
{
    var configsFilter = $@"{configuration.PublishingFolder}\App_Config\Include\**\easyJet.*.config";
    var configs = GetFiles(configsFilter, InitializeGlobberSettings()).ToList();
    foreach(var config in configs)
    {
      Information($"Deleting config: {config}");
      DeleteFile(config);
    }
    var customDllFilter = $@"{configuration.PublishingFolder}\bin\**\easyJet.*.dll";
    var dlls = GetFiles(customDllFilter, InitializeGlobberSettings()).ToList();
    foreach(var dll in dlls)
    {
      Information($"Deleting dll: {dll}");
      DeleteFile(dll);
    }
}

public void DeleteUnwantedDllFiles(string filesFilter, IEnumerable<string> dllsToDelete)
{
    if (dllsToDelete == null || !dllsToDelete.Any())
    {
        Information("No DLLs specified for deletion.");
        return;
    }

    // Normalize target DLL list
    var deleteSet = new HashSet<string>(
        dllsToDelete.Select(x => x.ToLowerInvariant())
    );

    var globSettings = InitializeGlobberSettings();

    // Find all DLL files matching the filter
    var dllFiles = GetFiles(filesFilter, globSettings)
        .Where(file => file.GetExtension().Equals(".dll", StringComparison.OrdinalIgnoreCase))
        .ToList();

    if (!dllFiles.Any())
    {
        Information("No DLL files found matching the filter.");
        return;
    }

    foreach (var file in dllFiles)
    {
        var fileName = file.GetFilename().ToString().ToLowerInvariant();

        if (deleteSet.Contains(fileName))
        {
            Information($"Deleting: {file.FullPath}");
            DeleteFile(file);
        }
    }
}