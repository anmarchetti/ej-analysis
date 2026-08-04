using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class TimeSlotFilterTests
{
    [Fact]
    public async Task GetOptions_WhenFlightFiltersAreNull_ReturnsEmptyOptions()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        referenceDataService.Setup(x => x.GetFlightFilters()).ReturnsAsync((List<FlightFilters>)null);
        var sut = new TimeSlotFilter(referenceDataService.Object);

        // Act
        var result = await sut.GetOptions(
            [new AvCacheResultOffersOfferExtended()],
            new PackagesSearchRequest(),
            (set, _) => Task.FromResult(set));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
        referenceDataService.Verify(x => x.GetFilterPillsConfig(), Times.Never);
    }

    [Fact]
    public async Task GetOptions_WhenFilterPillConfigContainsMatchingCompositeCode_SetsFullName()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        referenceDataService
            .Setup(x => x.GetFlightFilters())
            .ReturnsAsync(
            [
                new FlightFilters
                {
                    Name = "Morning",
                    TimeSlots =
                    [
                        new TimeSlot
                        {
                            Code = "06:00-12:00",
                            Name = "06:00-12:00",
                            AtcomCode = "AM"
                        }
                    ]
                }
            ]);

        referenceDataService
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                Options =
                [
                    new FilterPillOption
                    {
                        FilterCode = AvailableFilters.TimeSlot,
                        Code = "Morning|06:00-12:00",
                        Name = "Morning Flights"
                    }
                ]
            });

        var sut = new TimeSlotFilter(referenceDataService.Object);
        var offers = new List<AvCacheResultOffersOfferExtended> { new() };

        // Act
        var result = await sut.GetOptions(
            offers,
            new PackagesSearchRequest(),
            (set, _) => Task.FromResult(set));

        // Assert
        result.Options.Should().HaveCount(1);
        result.Options[0].Children.Should().ContainSingle();
        result.Options[0].Children[0].FullName.Should().Be("Morning Flights");
    }

    [Fact]
    public async Task GetOptions_WhenNoMatchingFilterPillExists_LeavesFullNameNull()
    {
        // Arrange
        var referenceDataService = new Mock<IReferenceDataService>();
        referenceDataService
            .Setup(x => x.GetFlightFilters())
            .ReturnsAsync(
            [
                new FlightFilters
                {
                    Name = "Evening",
                    TimeSlots =
                    [
                        new TimeSlot
                        {
                            Code = "18:00-23:00",
                            Name = "18:00-23:00",
                            AtcomCode = "PM"
                        }
                    ]
                }
            ]);

        referenceDataService
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig { Options = [] });

        var sut = new TimeSlotFilter(referenceDataService.Object);
        var offers = new List<AvCacheResultOffersOfferExtended> { new() };

        // Act
        var result = await sut.GetOptions(
            offers,
            new PackagesSearchRequest(),
            (set, _) => Task.FromResult(set));

        // Assert
        result.Options[0].Children[0].FullName.Should().BeNull();
    }
}