using easyJet.Holidays.Tests.Domain.Integration;
using WireMock.Server;
using WireMock.Settings;
using Xunit;

namespace easyJet.Holidays.Tests.Domain.ComponentTests;

public class ExternalSystemFixture : IAsyncLifetime
{
    public static readonly string WiremockStaticMappingsBaseFolder =
        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "__admin", "mappings");

    private WireMockServer _atcomWireMockServer;
    private WireMockServer _cmsWireMockServer;
    private WireMockServer _b2BWireMockServer;
    private WireMockServer _dFloWireMockServer;
    private WireMockServer _voucherifyMockServer;
    private WireMockServer _tripadvisorMockServer;
    private WireMockServer _googleMockServer;
    private WireMockServer _musementMockServer;
    private WireMockServer _smartseerMockServer;
    private WireMockServer _sesMockServer;
    private WireMockServer _paymentMockServer;
    private WireMockServer _datahubMockServer;
    private WireMockServer _feefoMockServer;
    private WireMockServer _salesforceMockServer;
    private WireMockServer _data8MockServer;

    public ValueTask InitializeAsync()
    {
        _atcomWireMockServer = GetWiremockServer("Atcom", "http://localhost:5001");
        _cmsWireMockServer = GetWiremockServer("CMS", "http://localhost:5002");
        _b2BWireMockServer = GetWiremockServer("B2B", "http://localhost:5003");
        _dFloWireMockServer = GetWiremockServer("dFlo", "http://localhost:5004");
        _feefoMockServer = GetWiremockServer("feefo", "http://localhost:5005");
        _voucherifyMockServer = GetWiremockServer("voucherify", "http://localhost:5006");
        _tripadvisorMockServer = GetWiremockServer("TripAdvisor", "http://localhost:5007");
        _googleMockServer = GetWiremockServer("reCAPTCHA", "http://localhost:5008");
        _musementMockServer = GetWiremockServer("Musement", "http://localhost:5009");
        _smartseerMockServer = GetWiremockServer("Smartseer", "http://localhost:5010");
        _sesMockServer = GetWiremockServer("SES", "http://localhost:5012");
        _paymentMockServer = GetWiremockServer("Payment", "http://localhost:5013");
        _salesforceMockServer = GetWiremockServer("Salesforce", "http://localhost:5014");
        _datahubMockServer = GetWiremockServer("DataHub", "http://localhost:5015");
        _data8MockServer = GetWiremockServer("Data8", "http://localhost:5016");

        return ValueTask.CompletedTask;
    }

    public ValueTask DisposeAsync()
    {
        _atcomWireMockServer.Stop();
        _cmsWireMockServer.Stop();
        _b2BWireMockServer.Stop();
        _dFloWireMockServer.Stop();
        _feefoMockServer.Stop();
        _voucherifyMockServer.Stop();
        _tripadvisorMockServer.Stop();
        _googleMockServer.Stop();
        _musementMockServer.Stop();
        _smartseerMockServer.Stop();
        _sesMockServer.Stop();
        _paymentMockServer.Stop();
        _datahubMockServer.Stop();
        _data8MockServer.Stop();
        _salesforceMockServer.Stop();

        return ValueTask.CompletedTask;
    }

    private WireMockServer GetWiremockServer(string mappingFolder, params string[] urls)
    {
        return WireMockServer.Start(GetSettings(mappingFolder, urls));
    }

    private static WireMockServerSettings GetSettings(string mappingFolder, string[] urls, bool ssl = false)
    {
        return new WireMockServerSettings
        {
            Urls = urls,
            FileSystemHandler = new CustomFolderFileSystemHandler(WiremockStaticMappingsBaseFolder, mappingFolder),
            StartAdminInterface = false,
            ReadStaticMappings = true,
            WatchStaticMappings = false,
            WatchStaticMappingsInSubdirectories = true,
            UseSSL = ssl
        };
    }
}