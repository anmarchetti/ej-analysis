using easyJet.Holidays.Api;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Extensions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Console;
using WireMock.Server;
using WireMock.Settings;
using Xunit;

[assembly: AssemblyFixture(typeof(CloudEmulationFixture))]
[assembly: AssemblyFixture(typeof(ExternalSystemFixture))]
namespace easyJet.Holidays.Tests.Domain.ComponentTests;

/// <summary>
/// Base component test with prepared http client <br />
/// <b>ONLY</b> use this if you really need
/// <see cref="SpawnServer"/> and/or
/// <see cref="ApplyConfigurationField"/> or
/// <see cref="ApplyManyConfigurationFields"/>. <br />
/// Prefer usage of Fixture aware base class otherwise.
/// </summary>
public abstract class BaseComponentTest : IDisposable
{
    public HttpClient Client { get; protected set; }

    protected static readonly string WiremockStaticMappingsBaseFolder =
        ExternalSystemFixture.WiremockStaticMappingsBaseFolder;

    protected WebApplicationFactory<Startup> Factory;

    private static readonly object SpawnLock = new();
    private readonly Dictionary<string, WireMockServer> _temporaryMockServers = new();

    protected virtual string[] AdditionalConfigFiles { get; } = [];

    /// <summary>
    /// standard ctor
    /// </summary>
    protected BaseComponentTest()
    {
        var factory = new WebApplicationFactory<Startup>();
        // done intentionally to be able to change incoming configs
        Factory = ConfigureWebApplicationFactory(factory);
        Client = Factory.CreateClient();
    }

    /// <summary>
    /// Applies a value to configuration on a fly. Use, when you need to override configuration, that is being applied at startup
    /// ATTENTION!!! This would create new HttpClient, so if you are doing any additional tweaks to it while your test Arrange phase - do them after this call
    /// </summary>
    /// <param name="key">colon-separated path to the config field, like "Cms:Host" (same, as is being done on octopus)</param>
    /// <param name="value">string value of the configuration field</param>
    public void ApplyConfigurationField(string key, string value)
    {
        ApplyManyConfigurationFields(new[] { new KeyValuePair<string, string>(key, value) });
    }

    /// <summary>
    /// Applies a value to configuration on a fly. Use, when you need to override configuration, that is being applied at startup
    /// ATTENTION!!! This would create new HttpClient, so if you are doing any additional tweaks to it while your test Arrange phase - do them after this call
    /// </summary>
    /// <param name="fieldValues">collection of the same format, as in method <see cref="ApplyConfigurationField"/></param>
    public void ApplyManyConfigurationFields(IEnumerable<KeyValuePair<string, string>> fieldValues)
    {
        Factory = Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, conf) =>
            {
                conf.AddInMemoryCollection(fieldValues);
            });
        });

        Client = Factory.CreateClient();
    }

    /// <summary>
    /// Spawns additional WireMock server for the test and ensures, it gets disposed right at the moment the test finishes.
    /// Use this when you need to alter the server mappings from inside the code, using <see cref="WireMockServer.Given"/>
    /// and/or other stuff. Has a static lock to spawn 1 server at a time, because for default behavior it sometimes fails with error
    /// "An operation on a socket could not be performed because the system lacked sufficient buffer space or because a queue was full"
    /// </summary>
    /// <param name="name">name of the server to differentiate instances</param>
    /// <param name="wireMockServerSettings">Custom WireMock settings. do not pass anything to create default server</param>
    /// <returns>WireMock server for alterations</returns>
    public WireMockServer SpawnServer(string name, WireMockServerSettings wireMockServerSettings = null)
    {
        lock (SpawnLock)
        {
            name = $"{name}-{Guid.NewGuid()}";
            WireMockServer server;
            if (wireMockServerSettings is null)
            {
                server = WireMockServer.Start();
            }
            else
            {
                server = WireMockServer.Start(wireMockServerSettings);
            }

            _temporaryMockServers[name] = server;
            return server;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        lock (SpawnLock)
        {
            foreach (var mockServer in _temporaryMockServers.Values)
            {
                mockServer.Stop(); // doing so, because Dispose() does not wait for server to stop, just fires a task to stop it
                mockServer.Dispose();
            }
        }

        Factory.Dispose();
    }

    /// <summary>
    /// Override this method inside children to change the way, factory is being configured
    /// </summary>
    /// <param name="factory"></param>
    /// <returns></returns>
    protected WebApplicationFactory<Startup> ConfigureWebApplicationFactory(WebApplicationFactory<Startup> factory)
    {
        return ConfigureWebApplicationFactoryInner(factory);
    }

    protected WebApplicationFactory<Startup> ConfigureWebApplicationFactoryInner(WebApplicationFactory<Startup> factory)
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

                foreach (var fileName in AdditionalConfigFiles)
                {
                    conf.AddJsonFile(Path.Combine(testsProjectDir, fileName));
                }

                //aws secrets config source shouldn't be used when running integration tests, however it's added
                //by CreateWebHostBuilder of web API before it can be influenced by integration test startup
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

    protected virtual void SetupApiAuthorizationForClient()
    {
        Client.DefaultRequestHeaders.Add("Authorization", "yeymtmwg0mzdt80chqveeopojn897s58yciqfhvl508mpq4dmna9w907617q");
    }
}