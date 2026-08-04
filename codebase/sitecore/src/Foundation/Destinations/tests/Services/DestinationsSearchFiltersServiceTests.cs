using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class DestinationsSearchFiltersServiceTests
    {
        private const int ChunkSize = 500;
        private readonly IDestinationsSearchFiltersRepository destinationsSearchFiltersRepository;
        private readonly IFacilityMatrixService facilityMatrixService;
        private readonly BaseSettings settings;
        private readonly DestinationsSearchFiltersService destinationsSearchFiltersService;

        public DestinationsSearchFiltersServiceTests()
        {
            destinationsSearchFiltersRepository = Substitute.For<IDestinationsSearchFiltersRepository>();
            facilityMatrixService = Substitute.For<IFacilityMatrixService>();
            settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(ChunkSize);
            destinationsSearchFiltersService = new DestinationsSearchFiltersService(settings, destinationsSearchFiltersRepository, facilityMatrixService);
        }

        [Fact]
        public void GetFilters_ShouldReturnFilters_IfFiltersExist()
        {
            // Arrange
            int totalNumberOfCodes = 1500;

            destinationsSearchFiltersRepository.GetAllFiltersByAccommodationCodes(Arg.Any<List<string>>())
                .Returns(GetSearches(ChunkSize), GetSearches(ChunkSize * 2, ChunkSize), GetSearches(ChunkSize * 3, ChunkSize * 2));

            // Act
            var actual = destinationsSearchFiltersService.GetFilters(GetCodes(totalNumberOfCodes).ToArray()).ToArray();

            // Assert
            actual.Length.Should().Be(totalNumberOfCodes);
        }

        private SearchResults<HotelSearchResultItem> GetSearches(int totalResult, int shift = 0)
        {
            var hints = new List<SearchHit<HotelSearchResultItem>>();

            for (int i = 0 + shift; i < totalResult; i++)
            {
                hints.Add(new SearchHit<HotelSearchResultItem>(i, new HotelSearchResultItem()
                {
                    SourceCodes = new[] { $"{i}" },
                }));
            }

            return new SearchResults<HotelSearchResultItem>(hints, totalResult);
        }

        private IEnumerable<string> GetCodes(int totalResult)
        {
            for (int i = 0; i < totalResult; i++)
            {
                yield return $"{i}";
            }
        }
    }
}
