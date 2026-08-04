using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class DestinationsSearchFiltersRepositoryTests
    {
        private readonly IDestinationSearchSettings settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;
        private readonly IDestinationsLogger logger;

        public DestinationsSearchFiltersRepositoryTests()
        {
            settings = Substitute.For<IDestinationSearchSettings>();
            settings.IndexName.Returns("sitecore_test_index");
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            logger = Substitute.For<IDestinationsLogger>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void GetAllFiltersByAccommodationCodes_ShouldGetAllFiltersByAccommodationCodes_IfDataExist(string code, string name, string[] filteredFacilities, string[] boards, int starRating, float hotelRating)
        {
            var hotelResult = new HotelSearchResultItem()
            {
                TemplateId = Constants.TemplateIds.Accommodation,
                Name = name,
                FilteredFacilities = filteredFacilities,
                Boards = boards,
                HotelRating = hotelRating,
                StarRating = starRating,
                SourceCodes = new[] { code },
                IsLatestVersion = true,
                Language = "en",
                Path = "/sitecore/content"
            };
            // Arrange
            using (new FakeSiteContextSwitcher(GetFakeSiteContext()))
            {
                var queryable = new SearchProviderQueryableCollection<HotelSearchResultItem>(new HotelSearchResultItem[]
                {
                    hotelResult,
                });
                queryable.DefaultValues.Add(hotelResult);

                queryable.DefaultValues.Add(new HotelSearchResultItem()
                {
                    Language = "en",
                    IsLatestVersion = true,
                    Path = "/sitecore/content",
                    HotelRating = hotelRating,
                    StarRating = starRating,
                    SourceCodes = new[] { code }
                });

                provider.GetQueryable<HotelSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new DestinationsSearchFiltersRepository(settings, logger).GetAllFiltersByAccommodationCodes(new List<string> { code });

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.SourceCodes.Should().Contain(code);
                    result.Hits.FirstOrDefault().Document.StarRating.Should().Be(starRating);
                    result.Hits.FirstOrDefault().Document.HotelRating.Should().Be(hotelRating);
                    for (int i = 0; i < filteredFacilities.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.FilteredFacilities[i].Should().Be(filteredFacilities[i]);
                    }

                    for (int i = 0; i < boards.Length; i++)
                    {
                        result.Hits.FirstOrDefault().Document.Boards[i].Should().Be(boards[i]);
                    }
                }
            }
        }

        private FakeSiteContext GetFakeSiteContext()
        {
            return new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });
        }
    }
}
