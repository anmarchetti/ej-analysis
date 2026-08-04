using easyJet.Holidays.Api;
using easyJet.Holidays.Tests.Domain.Extensions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Console;

namespace easyJet.Holidays.Tests.Domain.ComponentTests;

public class WebApplicationFixture : IDisposable
{
    protected virtual string[] AdditionalAppSettingsFileNames { get; } = [];
    protected virtual List<KeyValuePair<string, string>> DefaultHeaders { get; } = [
        new ("Authorization", "yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q")
    ];

    private readonly WebApplicationFactory<Startup> _factory;

    public HttpClient Client { get; protected set; }

    public WebApplicationFixture()
    {
        var factory = new WebApplicationFactory<Startup>();
        _factory = ConfigureWebApplicationFactory(factory);

        Client = _factory.CreateClient();

        // ensuring that the 'default' client has the most common configuration applied.
        // if you need one without this configuration, simply invoke CreateClient.
        SetupApiAuthorizationForClient();
    }

    protected WebApplicationFactory<Startup> ConfigureWebApplicationFactory(WebApplicationFactory<Startup> factory)
    {
        Environment.SetEnvironmentVariable("AWS_ACCESS_KEY_ID", "fake");
        Environment.SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", "fake");

        return factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, conf) =>
            {
                var testsProjectDir = Directory.GetCurrentDirectory();
                //default file, that can be overriden by additional provided files
                conf.AddJsonFile(Path.Combine(testsProjectDir, "appsettings.componentTests.json"));

                foreach (var fileName in AdditionalAppSettingsFileNames)
                {
                    conf.AddJsonFile(Path.Combine(testsProjectDir, fileName));
                }

                //aws secrets config source shouldn't be used when running component tests, however it's added
                //by CreateWebHostBuilder of web API before it can be influenced by component test startup
                var awsSecretsConfigSource = conf.Sources.OfType<AwsSecretsManagerConfigurationSource>().FirstOrDefault();
                if (awsSecretsConfigSource != null)
                {
                    conf.Sources.Remove(awsSecretsConfigSource);
                }
            });
            builder.ConfigureTestServices(collection =>
            {
                collection.RemoveByImplementingType(typeof(ConsoleLoggerProvider));
            });
        });
    }

    public HttpClient CreateClient() => _factory.CreateClient();

    protected void SetupApiAuthorizationForClient()
    {
        foreach (var header in DefaultHeaders)
        {
            Client.DefaultRequestHeaders.Add(header.Key, header.Value);
        }
    }

    public void Dispose()
    {
        _factory.Dispose();
    }
}