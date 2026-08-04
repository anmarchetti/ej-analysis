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

public class TripAdvisorFilterTests
{
    [Fact]
    public async Task GetOptions_WhenOffersAreEmpty_ReturnsEmptyOptions()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        var sut = new TripAdvisorFilter(referenceDataService.Object);

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
                        FilterCode = AvailableFilters.TripadvisorRating,
                        Code = "4",
                        Name = "4+ TripAdvisor Rating"
                    }
                ]
            });

        var sut = new TripAdvisorFilter(referenceDataService.Object);
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(tripAdvisorRating: 4),
            CreateOffer(tripAdvisorRating: 5)
        };

        ApplyAllFiltersFunc applyAllOtherFilters = (set, _) => Task.FromResult(set);

        // Act
        var result = await sut.GetOptions(offers, new PackagesSearchRequest(), applyAllOtherFilters);

        // Assert
        result.Options.First(x => x.Code == "4").FullName.Should().Be("4+ TripAdvisor Rating");
        result.Options.First(x => x.Code == "5").FullName.Should().BeNull();
    }

    [Fact]
    public async Task FilterBy_WhenRequestHasTripAdvisorRating_FiltersByMinRatingToFive()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        var sut = new TripAdvisorFilter(referenceDataService.Object);
        var request = new PackagesSearchRequest { TripAdvisorRating = 4 };
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(tripAdvisorRating: 3),
            CreateOffer(tripAdvisorRating: 4),
            CreateOffer(tripAdvisorRating: 5),
            CreateOffer(tripAdvisorRating: 7)
        };

        // Act
        var result = await sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Select(o => o.Accom.First().TripAdvisorRating).Should().BeEquivalentTo([4d, 5d]);
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(double tripAdvisorRating)
    {
        return new AvCacheResultOffersOfferExtended(
            new AvCacheResultOffersOffer(),
            [
                new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                {
                    TripAdvisorRating = tripAdvisorRating
                }
            ]);
    }
}