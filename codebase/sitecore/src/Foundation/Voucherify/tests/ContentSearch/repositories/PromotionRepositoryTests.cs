using System;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.ContentSearch;
using easyJet.Foundation.Voucherify.ContentSearch.Repositories;
using easyJet.Foundation.Voucherify.ContentSearch.SearchTypes;
using easyJet.Foundation.Voucherify.ContentSearch.Settings;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.ContentSearch.Repositories
{
    public class PromotionRepositoryTests
    {
        private readonly IPromotionSearchSetting settings;
        private readonly IProviderSearchContext searchProvider;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ProviderIndexConfiguration configuration;
        private readonly FakeSearchIndex index;

        public PromotionRepositoryTests()
        {
            settings = Substitute.For<IPromotionSearchSetting>();
            settings.IndexName.Returns("sitecore_test_index");

            searchProvider = Substitute.For<IProviderSearchContext>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            configuration = Substitute.For<ProviderIndexConfiguration>();
            index = new FakeSearchIndex(searchProvider, configuration, settings.IndexName);
        }

        [Theory]
        [InlineData("UK", true, "en")]
        public void GetAll_ShouldReturnPromotion_IfSearchHasPromotionWithMarket(string marketCode, bool isLatestVersion, string lang)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        Language = lang
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        MarketCodes = new[] { "CH" },
                        IsLatestVersion = isLatestVersion,
                        Language = lang
                    }
            });

            var fakeItem = new FakeItem();

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(fakeItem);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetAll(marketCode);

                // Assert
                actual.Should().HaveCount(1);
                actual[0].ID.Should().Be(fakeItem.ID);
            }
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnNull_IfSearchHasNoPromotionWithMarket(string marketCode)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        MarketCodes = Array.Empty<string>()
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        MarketCodes = Array.Empty<string>()
                    }
            });

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetAll(marketCode);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [InlineData("atcom01", "UK", true, "en")]
        public void GetPromotionByAtcomCode_ShouldReturnPromotion_IfSearchHasPromotionWithMarket(string atcomCode, string marketCode, bool isLatestVersion, string lang)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        AtcomPromoCode = atcomCode,
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { atcomCode },
                        Language = lang
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        AtcomPromoCode = "atcom02",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { atcomCode },
                        Language = lang
                    }
            });

            var fakeItem = new FakeItem();

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(fakeItem);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetPromotionByAtcomCode(atcomCode, marketCode);

                // Assert
                actual.ID.Should().Be(fakeItem.ID);
            }
        }

        [Theory]
        [InlineData("atcom01", "UK", true, "en")]
        public void GetPromotionByAtcomCode_ShouldReturnNull_IfSearchHasNoPromotionWithMarket(string marketCode, string atcomCode, bool isLatestVersion, string lang)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        AtcomPromoCode = "00",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { atcomCode },
                        Language = lang
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        AtcomPromoCode = "01",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { atcomCode },
                        Language = lang
                    }
            });

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetPromotionByAtcomCode(atcomCode, marketCode);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [InlineData("promo01", "UK", true, "en")]
        public void GetPromotion_ShouldReturnPromotion_IfSearchHasPromotionWithMarket(string code, string marketCode, bool isLatestVersion, string lang)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        CustomerPromoCode = code,
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { "test" },
                        Language = lang
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        CustomerPromoCode = "promo02",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { "test2" },
                        Language = lang
                    }
            });

            var fakeItem = new FakeItem();

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);
            databaseProvider.GetItem(Arg.Any<ItemUri>(), Arg.Any<Language>()).Returns(fakeItem);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetPromotions(code, marketCode, null);

                // Assert
                actual.Should().NotBeNull();
                actual[0].ID.Should().Be(fakeItem.ID);
            }
        }

        [Theory]
        [InlineData("promo01", "UK", true, "en")]
        public void GetPromotion_ShouldReturnNull_IfSearchHasNoPromotionWithMarket(string promoCode, string marketCode, bool isLatestVersion, string lang)
        {
            // Arrange
            var queryable = new SearchProviderQueryableCollection<PromotionSearchResultItem>(new PromotionSearchResultItem[]
            {
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        CustomerPromoCode = "00",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { "test2" },
                        Language = lang
                    },
                    new PromotionSearchResultItem()
                    {
                        TemplateId = Templates.Promotion.Id,
                        CustomerPromoCode = "01",
                        MarketCodes = new[] { marketCode },
                        IsLatestVersion = isLatestVersion,
                        PromotionCodes = new[] { "test1" },
                        Language = lang
                    }
            });

            searchProvider.GetQueryable<PromotionSearchResultItem>().Returns(queryable);
            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns((Item)null);

            using (new ContentSearchSwitcher(index))
            {
                var repository = new PromotionRepository(databaseProvider, settings);

                // Act
                var actual = repository.GetPromotions(promoCode, marketCode, null);

                // Assert
                actual.Should().BeEmpty();
            }
        }
    }
}
