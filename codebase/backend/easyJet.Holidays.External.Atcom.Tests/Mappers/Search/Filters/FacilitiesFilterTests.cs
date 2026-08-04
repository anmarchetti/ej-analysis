using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class FacilitiesFilterTests
{
    private static AvCacheResultOffersOfferExtended CreateOffer(params FacilityGroup[] facilityGroups)
    {
        var accom = new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
        {
            FacilityGroups = facilityGroups.ToList()
        };

        return new AvCacheResultOffersOfferExtended(
            new AvCacheResultOffersOffer(),
            new[] { accom });
    }

    [Fact]
    public async Task GetOptions_ShouldMapTrackingId_ForGroupAndFacilities()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(new FacilityGroup
            {
                Name = "Pool",
                TrackingId = "tracking-group-pool",
                Order = 1,
                FacilityFilteredTypes = new List<Facility>
                {
                    new Facility { Code = "abcd", Name = "Outdoor pool", TrackingId = "tracking-abcd", Order = 1 },
                    new Facility { Code = "cdef", Name = "Indoor pool", TrackingId = "tracking-cdef", Order = 2 }
                }
            })
        };

        var sut = new FacilitiesFilter();

        // Act
        var result = await sut.GetOptions(offers, new PackagesSearchRequest(), (o, r) => Task.FromResult(o));

        // Assert
        var group = result.Options.Single();
        group.Name.Should().Be("Pool");
        group.TrackingId.Should().Be("tracking-group-pool");

        group.Children.Single(c => c.Code == "ABCD").TrackingId.Should().Be("tracking-abcd");
        group.Children.Single(c => c.Code == "CDEF").TrackingId.Should().Be("tracking-cdef");
    }

    [Fact]
    public async Task GetOptions_ShouldMapNullTrackingId_WhenNotProvided()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(new FacilityGroup
            {
                Name = "Pool",
                TrackingId = null,
                Order = 1,
                FacilityFilteredTypes = new List<Facility>
                {
                    new Facility { Code = "abcd", Name = "Outdoor pool", TrackingId = null, Order = 1 }
                }
            })
        };

        var sut = new FacilitiesFilter();

        // Act
        var result = await sut.GetOptions(offers, new PackagesSearchRequest(), (o, r) => Task.FromResult(o));

        // Assert
        var group = result.Options.Single();
        group.TrackingId.Should().BeNull();
        group.Children.Single().TrackingId.Should().BeNull();
    }
}
