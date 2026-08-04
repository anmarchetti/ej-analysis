using System;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.ContentSearch.Queries;
using easyJet.Foundation.Multisite.ContentSearch.Repositories;
using easyJet.Foundation.Multisite.ContentSearch.SearchTypes;
using easyJet.Foundation.Multisite.ContentSearch.Settings;
using easyJet.Foundation.Testing.ContentSearch;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.ContentSearch.Repositories
{
    public class PublisingRepositoryTests
    {
        private readonly IPublisingSearchSetting settings;
        private readonly IProviderSearchContext provider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public PublisingRepositoryTests()
        {
            settings = new PublisingSearchSetting() { IndexName = "sitecore_test_index" };
            provider = Substitute.For<IProviderSearchContext>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(provider, configuration, settings.IndexName);
        }

        [Theory]
        [AutoData]
        public void GetPublishableItem_ShouldGetPublishableItem_IfPublishableItemExist(string name, PublishableItemQueryArgs args)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            DateTime utcNow = DateTime.UtcNow;
            DateTime publishableDateTime = utcNow.Add(new TimeSpan(-1, 1, 1));
            args.PublishableTimeRange = new TimeSpan(1, 1, 1);

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var queryable = new SearchProviderQueryableCollection<PublishableSearchResultItem>(new PublishableSearchResultItem[]
                {
                    new PublishableSearchResultItem()
                        {
                            Name = name,
                            IsLatestVersion = true,
                            Language = "en",
                            Path = args.RootPath,
                            ValidFrom = publishableDateTime,
                            ValidTo = publishableDateTime,
                            PublishDate = publishableDateTime,
                            UnpublishDate = publishableDateTime
                        }
                });

                provider.GetQueryable<PublishableSearchResultItem>().Returns(queryable);

                using (new ContentSearchSwitcher(index))
                {
                    // Act
                    var result = new PublishingRepository(settings).GetPublishableItem(args);

                    // Assert
                    result.Hits.Should().HaveCount(1);
                    result.Hits.FirstOrDefault().Document.Path.Should().Be(args.RootPath);
                }
            }
        }
    }
}
