public class Configuration
{
    public string WebsiteName = "sc.holidays.local";

    public string SolutionName = "easyJet.holidays.sc.sln";
    public string SolutionFolder = "./src"; 

    public string BuildConfiguration = "Debug";
    public string BuildToolVersion = "VS2022";

    public bool UseLocalNugetPackages = false;
    public string ContentFolder= "c:/inetpub/wwwroot/sc.holidays.local/App_Data/Scripts";
    public string PublishingFolder = "c:/inetpub/wwwroot/sc.holidays.local";
    public string XConnectPublishFolder = "c:/inetpub/wwwroot/sc.holidays.xconnect";

    public string XConnectJobsPublishFolder = "c:/inetpub/wwwroot/sc.holidays.xconnect/App_Data/jobs/continuous/AutomationEngine";
    public string XConnectProcessingEnginePublishFolder = "c:/inetpub/wwwroot/sc.holidays.xconnect/App_Data/jobs/continuous/ProcessingEngine";
    public string XConnectModelsPublishFolder = "c:/inetpub/wwwroot/sc.holidays.xconnect/App_Data/Models";
    public string XConnectIndexWorkerPublishFolder = "c:/inetpub/wwwroot/sc.holidays.xconnect/App_Data/jobs/continuous/IndexWorker/App_Data/Models";

    public string TrackerApiXConnectLibsFolderPath = "../tracker/lib";
} 