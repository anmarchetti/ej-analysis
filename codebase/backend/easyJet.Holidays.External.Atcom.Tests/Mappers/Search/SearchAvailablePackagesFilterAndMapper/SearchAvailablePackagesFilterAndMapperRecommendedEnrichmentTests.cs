using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

public class SearchAvailablePackagesFilterAndMapperRecommendedEnrichmentTests
{

    [Fact]
    public void EnrichRecommendedFilterOptions_NullFilterOptions_DoesNotThrow()
    {
        // Arrange
        Dictionary<AvailableFilters, FilterOptions> filterOptions = null;

        // Act
        Action act = () => SearchAvailablePackagesFilterAndMapper.EnrichRecommendedFilterOptions(filterOptions);

        // Assert
        act.Should().NotThrow();
    }

    [Fact]
    public void EnrichRecommendedFilterOptions_NoRecommendedFilter_RemovesRecommendedKey()
    {
        // Arrange
        var filterOptions = new Dictionary<AvailableFilters, FilterOptions>
        {
            { AvailableFilters.Board, new FilterOptions { Options = new List<FilterOption>() } }
        };

        // Act
        SearchAvailablePackagesFilterAndMapper.EnrichRecommendedFilterOptions(filterOptions);

        // Assert
        filterOptions.Should().NotContainKey(AvailableFilters.Recommended);
    }

    [Fact]
    public void EnrichRecommendedFilterOptions_EnrichesRecommendedOptionWithSourceData()
    {
        // Arrange
        var filterOptions = new Dictionary<AvailableFilters, FilterOptions>
        {
            { AvailableFilters.Recommended, new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption { FilterCode = AvailableFilters.Board, Code = "AI", Name = "All Inclusive" }
                    }
                }
            },
            { AvailableFilters.Board, new FilterOptions
                {
                    Options = new List<FilterOption>
                    {
                        new FilterOption { Code = "AI", Name = "All Inclusive", Count = 42, AtcomCode = "ATCOM_AI" }
                    }
                }
            }
        };

        // Act
        SearchAvailablePackagesFilterAndMapper.EnrichRecommendedFilterOptions(filterOptions);

        // Assert
        var recommendedOption = filterOptions[AvailableFilters.Recommended].Options[0];
        recommendedOption.Count.Should().Be(42);
        recommendedOption.AtcomCode.Should().Be("ATCOM_AI");
    }

    [Fact]
    public void TryEnrichRecommendedTimeSlotOption_ValidTimeSlotCode_EnrichesWithParentAndChild()
    {
        // Arrange
        var recommendedOption = new FilterOption
        {
            FilterCode = AvailableFilters.TimeSlot,
            Code = "Morning|06:00-12:00",
            Name = "Morning Flights"
        };
        var sourceOptions = new List<FilterOption>
        {
            new FilterOption
            {
                Name = "Morning",
                Count = 10,
                Children = new List<FilterOption>
                {
                    new FilterOption { Code = "06:00-12:00", Name = "06:00-12:00", Count = 5, StartTime = new DateTime(1, 1, 1, 6, 0, 0), EndTime = new DateTime(2100, 1, 1, 12, 0, 0) }
                }
            }
        };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedTimeSlotOption(recommendedOption, sourceOptions);

        // Assert
        result.Should().BeTrue();
        recommendedOption.Name.Should().Be("Morning");
        recommendedOption.Count.Should().Be(10);
        recommendedOption.Children.Should().HaveCount(1);
        recommendedOption.Children[0].Code.Should().Be("06:00-12:00");
    }

    [Fact]
    public void TryEnrichRecommendedTimeSlotOption_NullRecommendedOption_ReturnsFalse()
    {
        // Arrange
        FilterOption recommendedOption = null;
        var sourceOptions = new List<FilterOption>();

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedTimeSlotOption(recommendedOption, sourceOptions);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void TryEnrichRecommendedTimeSlotOption_InvalidCodeFormat_ReturnsFalse()
    {
        // Arrange
        var recommendedOption = new FilterOption { Code = "NoSeparator" };
        var sourceOptions = new List<FilterOption>();

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedTimeSlotOption(recommendedOption, sourceOptions);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void TryEnrichRecommendedChildOption_FindsChildInParent_EnrichesOption()
    {
        // Arrange
        var recommendedOption = new FilterOption
        {
            Code = "BB+",
            Name = "Bed & Breakfast Plus"
        };
        var sourceOptions = new List<FilterOption>
        {
            new FilterOption
            {
                Code = "BB",
                Name = "Bed & Breakfast",
                Count = 20,
                Children = new List<FilterOption>
                {
                    new FilterOption { Code = "BB+", Name = "BB Plus", Count = 8 }
                }
            }
        };

        // Act
        SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedChildOption(recommendedOption, sourceOptions);

        // Assert
        recommendedOption.Code.Should().Be("BB");
        recommendedOption.Name.Should().Be("Bed & Breakfast");
        recommendedOption.Count.Should().Be(8);
        recommendedOption.Children.Should().HaveCount(1);
        recommendedOption.Children[0].Code.Should().Be("BB+");
        recommendedOption.Children[0].Name.Should().Be("Bed & Breakfast Plus");
    }

    [Fact]
    public void TryEnrichRecommendedChildOption_NullRecommendedOption_DoesNotThrow()
    {
        // Arrange
        FilterOption recommendedOption = null;
        var sourceOptions = new List<FilterOption>();

        // Act
        Action act = () => SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedChildOption(recommendedOption, sourceOptions);

        // Assert
        act.Should().NotThrow();
    }

    [Fact]
    public void TryEnrichRecommendedChildOption_ChildNotFound_DoesNotModifyOption()
    {
        // Arrange
        var recommendedOption = new FilterOption
        {
            Code = "XX",
            Name = "Not Found"
        };
        var sourceOptions = new List<FilterOption>
        {
            new FilterOption
            {
                Code = "BB",
                Children = new List<FilterOption> { new FilterOption { Code = "BB+" } }
            }
        };

        // Act
        SearchAvailablePackagesFilterAndMapper.TryEnrichRecommendedChildOption(recommendedOption, sourceOptions);

        // Assert
        recommendedOption.Name.Should().Be("Not Found");
        recommendedOption.Children.Should().BeNullOrEmpty();
    }
}
