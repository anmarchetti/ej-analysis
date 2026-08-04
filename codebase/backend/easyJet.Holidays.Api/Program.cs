using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Logging;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.HttpLogging;
using NLog;
using NLog.LayoutRenderers;
using NLog.Web;

namespace easyJet.Holidays.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Configure NLog
            LayoutRenderer.Register<ContextMetadataLayoutRenderer>(ContextMetadataLayoutRenderer.LayoutRendererName);
            LayoutRenderer.Register<LogTypeLayoutRenderer>(LogTypeLayoutRenderer.LayoutRendererName);
            LayoutRenderer.Register<ApiErrorCodeLayoutRenderer>(ApiErrorCodeLayoutRenderer.LayoutRendererName);

            var logger = LogManager.Setup().LoadConfigurationFromFile("NLog.config").GetCurrentClassLogger();
            try
            {
                logger.Info($"Calling {nameof(CreateWebHostBuilder)}");
                CreateWebHostBuilder(args).Build().Run();
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Program startup failed");
                throw;
            }
            finally
            {
                // Flush and stop internal timers/threads before application exit
                LogManager.Shutdown();
            }
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
            .CaptureStartupErrors(true)
            .ConfigureAppConfiguration((config) =>
            {
                // Load mounted setting from EFS
                config.AddJsonFile("/mnt/efs/appsettings.json", optional: true, reloadOnChange: false);

                var settings = config.Build();
                var secretsManagerSettings = settings.GetSection("AWS:SecretsManager").Get<AwsSettingsSecretsManager>();
                var source = new AwsSecretsManagerConfigurationSource(secretsManagerSettings);
                config.Add(source);
            })
            .ConfigureServices(collection =>
            {
                collection.AddHttpLogging(options =>
                {
                    // negating the headers out of it, header allowlist is applied in the interceptor below
                    options.LoggingFields = HttpLoggingFields.Request &~ HttpLoggingFields.RequestHeaders; // response/metrics logging still done via Diagnostics
                    options.RequestBodyLogLimit = 100 * 1024; // taken from previous nlog setup
                });
                collection.AddHttpLoggingInterceptor<HeaderAllowlistLoggingInterceptor>();
            })
            .UseNLog()
            .UseIIS()
            .UseStartup<Startup>();
    }
}
