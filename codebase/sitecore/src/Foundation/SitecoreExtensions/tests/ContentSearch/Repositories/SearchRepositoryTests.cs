using System;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Repositories;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentSearch.Repositories
{
    public class SearchRepositoryTests
    {
        [Theory]
        [AutoDbData]
        public void Search_ShouldCreateDefaultIndex_IfAirportWithCountryCodeExists(
            ISearchSettings searchSettings,
            IProviderSearchContext provider,
            ProviderIndexConfiguration configuration)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(new Sitecore.Collections.StringDictionary
            {
                { "name", "fake" },
                { "database", "master" },
                { "language", "en" },
                { "rootPath", "/sitecore/content" }
            });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<BaseSearchResultItem>(new BaseSearchResultItem[]
                {
                    new BaseSearchResultItem()
                    {
                        LastUpdated = DateTime.Now,
                        IsLatestVersion = true,
                        ItemId = ID.NewID,
                        Language = "en",
                        Path = "/sitecore/content"
                    }
                });
                provider.GetQueryable<BaseSearchResultItem>().Returns(queryable);

                searchSettings.IndexName.Returns("sitecore_test_index");

                var index = new FakeSearchIndex(provider, configuration, searchSettings.IndexName);

                using (new ContentSearchSwitcher(index))
                {
                    var query = provider.GetQueryable<BaseSearchResultItem>();
                    var searchRepository = Substitute.For<SearchRepository>(searchSettings);

                    // Act
                    var result = searchRepository.Search(query, take: 1);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                }
            }
        }
    }
}