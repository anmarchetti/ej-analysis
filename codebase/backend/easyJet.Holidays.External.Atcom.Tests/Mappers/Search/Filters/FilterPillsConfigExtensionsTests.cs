using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class FilterPillsConfigExtensionsTests
{
    [Fact]
    public void GetFilterPillFullName_WhenConfigIsNull_ReturnsNull()
    {
        // Act
        var result = FilterPillsConfigExtensions.GetFilterPillFullName(null, AvailableFilters.StarRating, "5");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetFilterPillFullName_WhenMatchingOptionExists_ReturnsName()
    {
        // Arrange
        var config = new FilterPillsConfig
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
        };

        // Act
        var result = config.GetFilterPillFullName(AvailableFilters.StarRating, "5");

        // Assert
        result.Should().Be("5 Star Hotels");
    }

    [Fact]
    public void GetFilterPillFullName_WhenFilterOrCodeDoesNotMatch_ReturnsNull()
    {
        // Arrange
        var config = new FilterPillsConfig
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
        };

        // Act
        var result = config.GetFilterPillFullName(AvailableFilters.StarRating, "4");

        // Assert
        result.Should().BeNull();
    }
}