using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using FluentAssertions;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Tests.Services;
public class DestinationItemHelperTests
{
    public DestinationItemHelperTests()
    {
            
    }

    [Fact]
    public void GetAllRegionsDetails_ReturnsRegionsDetails()
    {
        string countryCode = "GB", regionCode = "regionCode", resortCode = "resortCode", virtualRegionCode = "VR1";
        var expectedRegionDetails = new List<RegionDetails>
        { 
            new RegionDetails { CountryCode = countryCode, RegionCode = regionCode },
            new RegionDetails { CountryCode = countryCode, RegionCode = virtualRegionCode, RelatedRegions = ["RR1", "RR2"] },
            new RegionDetails { CountryCode = $"{countryCode},GBNI", RegionCode = resortCode }
        };

        var destinationItems = new List<DestinationItem>
        {
            new DestinationItem { Code = regionCode, Type = DestinationItemType.Region, Parents = new List<DestinationItem> { new DestinationItem { Code = countryCode } } },
            new DestinationItem { Code = resortCode, Type = DestinationItemType.Resort, Parents = new List<DestinationItem> { new DestinationItem { Code = countryCode }, new DestinationItem { Code = "GBNI" } } },
            new DestinationItem { Code = virtualRegionCode, Type = DestinationItemType.VirtualRegion, 
               RelatedRegions = ["RR1", "RR2"], Parents = new List<DestinationItem> { new DestinationItem { Code = countryCode } } },
            new DestinationItem { Code = "Cntr1", Type = DestinationItemType.Country },
            new DestinationItem { Code = "VC1", Type = DestinationItemType.VirtualCountry },
        };

        var helper = new DestinationItemHelper();
        var result = helper.GetAllRegionsDetails(destinationItems);

        result.Should().HaveCount(expectedRegionDetails.Count);
        result.Equals(expectedRegionDetails);
    }

    [Fact]
    public void GetAllRegionsDetails_IfNoRegionsReturnsVirtualRegions()
    {
        string countryCode = "GB", virtualRegionCode = "VR1";
        var expectedRegionDetails = new List<RegionDetails>
        {
            new RegionDetails { CountryCode = countryCode, RegionCode = virtualRegionCode, RelatedRegions = ["RR1", "RR2"] },
        };

        var destinationItems = new List<DestinationItem>
        {
            new DestinationItem { Code = virtualRegionCode, Type = DestinationItemType.VirtualRegion,
               RelatedRegions = ["RR1", "RR2"], Parents = new List<DestinationItem> { new DestinationItem { Code = countryCode } } },
        };

        var helper = new DestinationItemHelper();
        var result = helper.GetAllRegionsDetails(destinationItems);

        result.Should().HaveCount(expectedRegionDetails.Count);
        result.Equals(expectedRegionDetails);
    }
}
