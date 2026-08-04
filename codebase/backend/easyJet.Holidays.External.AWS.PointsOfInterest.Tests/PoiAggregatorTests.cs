using Moq;
using PointsOfInterest;
using PointsOfInterest.Integrations.Sitecore;
using PointsOfInterest.Integrations.AwsPlaces;
using PointsOfInterest.Ancillaries;
using PointsOfInterest.Integrations.AwsBedrock;
using PointsOfInterest.Models;

namespace easyJet.Holidays.External.AWS.PointsOfInterest.Tests;

public class PoiAggregatorTests
{
    private static Resort CreateResort(string code="R1") => new()
    {
        ResortCode = code,
        ResortName = code + " Name",
        Hotels = new List<Hotel>(),
        Theme = "Active",
        QueryPositionLatitude = 1,
        QueryPositionLongitude = 2,
        PointsOfInterests = new List<PointOfInterest>()
    };

    [Fact]
    public async Task GeneratePOIsForResorts_CallsAllDependencies()
    {
        var sitecore = new Mock<ISitecoreApiClient>();
        var awsPlaces = new Mock<IAwsPlacesClient>();
        var repo = new Mock<IPointOfInterestRepository>();
        var bedrock = new Mock<IBedrockClient>();
        var resorts = new List<Resort>{CreateResort("R1"), CreateResort("R2")};
        sitecore.Setup(s => s.GetResorts(It.IsAny<PoiGenerationRequest>()))
            .ReturnsAsync(resorts);
        // Align with current IAwsPlacesClient: only SearchNearby per resort
        awsPlaces.Setup(a => a.SearchNearby(It.IsAny<Resort>()))
            .Returns(Task.CompletedTask);
        bedrock.Setup(b => b.EnrichPOIData(It.IsAny<Resort>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.RefreshResortPoiByResorts(It.IsAny<List<Resort>>()))
            .Returns(Task.CompletedTask);

        var agg = new PoiAggregator(sitecore.Object, awsPlaces.Object, repo.Object, bedrock.Object);

        await agg.GeneratePOIsForResorts(new PoiGenerationRequest());

        sitecore.Verify(s => s.GetResorts(It.IsAny<PoiGenerationRequest>()), Times.Once);
        awsPlaces.Verify(a => a.SearchNearby(It.IsAny<Resort>()), Times.Exactly(resorts.Count));
        bedrock.Verify(b => b.EnrichPOIData(It.IsAny<Resort>()), Times.Exactly(resorts.Count));
        repo.Verify(r => r.RefreshResortPoiByResorts(It.Is<List<Resort>>(l => l.SequenceEqual(resorts))), Times.Once);
    }

    [Fact]
    public async Task GeneratePOIsForResorts_WhenException_RethrowsAndSkipsRepository()
    {
        var sitecore = new Mock<ISitecoreApiClient>();
        sitecore.Setup(s => s.GetResorts(It.IsAny<PoiGenerationRequest>())).ThrowsAsync(new Exception("boom"));
        var awsPlaces = new Mock<IAwsPlacesClient>();
        var repo = new Mock<IPointOfInterestRepository>();
        var bedrock = new Mock<IBedrockClient>();

        var agg = new PoiAggregator(sitecore.Object, awsPlaces.Object, repo.Object, bedrock.Object);

        await Assert.ThrowsAsync<Exception>(() => agg.GeneratePOIsForResorts(new PoiGenerationRequest()));
        repo.Verify(r => r.RefreshResortPoiByResorts(It.IsAny<List<Resort>>()), Times.Never);
        awsPlaces.Verify(a => a.SearchNearby(It.IsAny<Resort>()), Times.Never);
        bedrock.Verify(b => b.EnrichPOIData(It.IsAny<Resort>()), Times.Never);
    }
}
