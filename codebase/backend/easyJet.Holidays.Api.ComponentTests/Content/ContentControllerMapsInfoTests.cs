using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Content;

/// <summary>
/// Component tests for <see cref="ContentController"/>
/// </summary>
public class ContentControllerMapsInfoTests : BaseFixtureAwareComponentTest
{
    public ContentControllerMapsInfoTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/content/maps-info")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task MapsInfo_ValidationFail_BrowserInfoMissing()
    {
        await Client.GetAndValidate(
            "/api/v1.0/content/maps-info",
            "__admin", "files", "WebApi", "content", "maps_info.json");
    }
}