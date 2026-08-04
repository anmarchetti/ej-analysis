using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Moq;
using System.Linq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class StarRatingFilterTests
{
    [Fact]
    public async Task GetOptions_WhenOffersAreEmpty_ReturnsEmptyOptions()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        var sut = new StarRatingFilter(referenceDataService.Object);

        // Act
        var result = await sut.GetOptions(
            [],
            new PackagesSearchRequest(),
            (set, _) => Task.FromResult(set));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
        referenceDataService.Verify(x => x.GetFilterPillsConfig(), Times.Never);
    }

    [Fact]
    public async Task GetOptions_WhenFilterPillConfigContainsMatch_SetsFullName()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        referenceDataService
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                Options =
                [
                    new FilterPillOption
                    {
                        FilterCode = AvailableFilters.StarRating,
                        Code = "5",
                        Name = "5 Star Hotels"
                    }
                ]
            });

        var sut = new StarRatingFilter(referenceDataService.Object);
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(starRating: 5),
            CreateOffer(starRating: 3)
        };

        ApplyAllFiltersFunc applyAllOtherFilters = (set, _) => Task.FromResult(set);

        // Act
        var result = await sut.GetOptions(offers, new PackagesSearchRequest(), applyAllOtherFilters);

        // Assert
        result.Options.First(x => x.Code == "5").FullName.Should().Be("5 Star Hotels");
        result.Options.First(x => x.Code == "3").FullName.Should().BeNull();
    }

    [Fact]
    public async Task FilterBy_WhenRequestHasStarRating_FiltersByRequestedRatings()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        var sut = new StarRatingFilter(referenceDataService.Object);
        var request = new PackagesSearchRequest { StarRating = "3, 5" };
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(starRating: 1),
            CreateOffer(starRating: 3),
            CreateOffer(starRating: 5)
        };

        // Act
        var result = await sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Select(o => o.Accom.First().StarRating).Should().BeEquivalentTo([3, 5]);
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(int starRating)
    {
        return new AvCacheResultOffersOfferExtended(
            new AvCacheResultOffersOffer(),
            [
                new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                {
                    StarRating = starRating
                }
            ]);
    }
}