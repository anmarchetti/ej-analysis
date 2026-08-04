using Microsoft.Extensions.Configuration;

namespace easyJet.Holidays.External.AWS.Domain.Extensions;

/// <summary>
/// holds common configuration extensions
/// </summary>
public static class BaseConfiguration
{
    /// <summary>
    /// Sets up configuration with both shared and local config as well as env variables.
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    public static IConfigurationBuilder AddLambdaConfiguration(this IConfigurationBuilder builder)
    {
        return builder
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.shared.json", optional: true, reloadOnChange: true)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables();
    }
}