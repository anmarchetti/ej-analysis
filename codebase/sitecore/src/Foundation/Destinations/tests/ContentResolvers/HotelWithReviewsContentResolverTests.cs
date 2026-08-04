using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class HotelWithReviewsContentResolverTests
    {
        private readonly HotelWithReviewsContentResolver resolver;
        private readonly IDestinationsRepository repository;
        private readonly IOrderedListItemsManager orderedListItemsManager;

        public HotelWithReviewsContentResolverTests()
        {
            repository = Substitute.For<IDestinationsRepository>();
            orderedListItemsManager = Substitute.For<IOrderedListItemsManager>();
            var settings = Substitute.For<BaseSettings>();
            settings.GetIntSetting("Destinations.HotelWithReviews.HotelTakeCount", 0).Returns(2);
            resolver = new HotelWithReviewsContentResolver(repository, orderedListItemsManager, settings);
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfGetContextItemReturnNull()
        {
            // Arrange
            resolver.UseContextItem = false;

            // Act
            var actual = resolver.ResolveContents(new Rendering(), null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetResorts_ShouldBeEmpty_IfContextItemIsNull()
        {
            // Arrange
            Item contextItem = null;

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetResorts_ShouldReturnContextItem_IfContextItemIsResort()
        {
            // Arrange
            Item contextItem = new FakeItem().WithTemplate(Constants.TemplateIds.Resort);

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().HaveCount(1);
            actual.First().Should().Be(contextItem);
        }

        [Fact]
        public void GetResorts_ShouldReturnResorts_IfContextItemRegionPage()
        {
            // Arrange
            var fakeItems = new List<Item> { new FakeItem(), new FakeItem() };
            Item contextItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionPage);
            orderedListItemsManager.GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(fakeItems);

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().HaveCount(fakeItems.Count);
        }

        [Fact]
        public void GetResorts_ShouldReturnResorts_IfContextItemRegionCityPage()
        {
            // Arrange
            var fakeItems = new List<Item> { new FakeItem(), new FakeItem() };
            Item contextItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionCityPage);
            orderedListItemsManager.GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(fakeItems);

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().HaveCount(fakeItems.Count);
        }

        [Fact]
        public void GetResorts_ShouldBeNull_IfOrderListItemsManagerReturnNull()
        {
            // Arrange
            Item contextItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionCityPage);
            orderedListItemsManager.GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>()).ReturnsNull();

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetResorts_ShouldReturnMultilistItems_IfContextItemIsVirtualResort()
        {
            // Arrange
            using (var db = new Db())
            {
                var resortOne = new DbItem("Resort One");
                var resortTwo = new DbItem("Resort Two");
                var virtualResort = new DbItem("Virtual Resort", ID.NewID, Constants.TemplateIds.VirtualResort);
                virtualResort.Fields.Add(Constants.Fields.VirtualDestination.Resorts, $"{resortOne.ID}|{resortTwo.ID}");

                db.Add(resortOne);
                db.Add(resortTwo);
                db.Add(virtualResort);

                // Act
                var actual = resolver.GetResorts(db.GetItem(virtualResort.ID)).ToList();

                // Assert
                actual.Should().HaveCount(2);
                actual.Select(x => x.ID).Should().Contain(new[] { resortOne.ID, resortTwo.ID });
            }
        }

        [Fact]
        public void GetResorts_ShouldBeNull_IfVirtualResortResortsFieldIsMissing()
        {
            // Arrange
            using (var db = new Db())
            {
                var virtualResortWithoutField = new DbItem("Virtual Resort", ID.NewID, Constants.TemplateIds.VirtualResort);
                db.Add(virtualResortWithoutField);

                // Act
                var actual = resolver.GetResorts(db.GetItem(virtualResortWithoutField.ID));

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void GetResorts_ShouldBeEmpty_IfTemplateIsNotValid()
        {
            // Arrange
            Item contextItem = new FakeItem().WithTemplate(Constants.TemplateIds.CountryPage);

            // Act
            var actual = resolver.GetResorts(contextItem);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetHotels_ShouldBeEmpty_IfResortsIsNull()
        {
            // Arrange
            Item[] resorts = null;

            // Act
            var actual = resolver.GetHotels(resorts);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldBeEmpty_IfRepositoryReturnNull(string itemPath)
        {
            // Arrange
            var contextItem = new FakeItem().WithPath(itemPath).WithTemplate(Constants.TemplateIds.Resort);
            resolver.UseContextItem = true;
            SearchResults<HotelWithReviewSearchResultItem> nullObject = null;
            repository.GetHotelsWithReviews(Arg.Any<string>()).Returns(nullObject);

            using (new ContextItemSwitcher(contextItem))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering(), Substitute.For<IRenderingConfiguration>()));

                // Assert
                actual["items"].Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldBeEmpty_IfRepositoryReturnEmptyResult(string itemPath)
        {
            // Arrange
            var contextItem = new FakeItem().WithPath(itemPath).WithTemplate(Constants.TemplateIds.Resort);
            resolver.UseContextItem = true;
            var emptyObject = new SearchResults<HotelWithReviewSearchResultItem>(Enumerable.Empty<SearchHit<HotelWithReviewSearchResultItem>>(), 0);
            repository.GetHotelsWithReviews(Arg.Any<string>()).Returns(emptyObject);

            using (new ContextItemSwitcher(contextItem))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering(), Substitute.For<IRenderingConfiguration>()));

                // Assert
                actual["items"].Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldResolveContents_IfRepositoryReturnResult(string itemPath, string itemName, int starRating, int totalNumberOfReviews, float hotelRating, string hotelUrl)
        {
            // Arrange
            var contextItem = new FakeItem().WithPath(itemPath).WithTemplate(Constants.TemplateIds.Resort);
            resolver.UseContextItem = true;
            var hints = new List<SearchHit<HotelWithReviewSearchResultItem>>()
            {
                {
                    new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()
                    {
                        ItemName = itemName,
                        StarRating = starRating,
                        TotalNumberOfReviews = totalNumberOfReviews,
                        HotelRating = hotelRating,
                        HotelUrl = hotelUrl,
                    })
                }
            };
            var results = new SearchResults<HotelWithReviewSearchResultItem>(hints, 1);

            repository.GetHotelsWithReviews(Arg.Any<string>()).Returns(results);

            using (new ContextItemSwitcher(contextItem))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering(), Substitute.For<IRenderingConfiguration>()));

                // Assert
                actual["items"].Should().HaveCount(1);
                actual["items"].Value<JArray>().First[Constants.Fields.DatasourceItem.Name].Value<string>().Should().Be(itemName);
                actual["items"].Value<JArray>().First[Constants.Fields.AccommodationItem.StarRating].Value<int>().Should().Be(starRating);
                actual["items"].Value<JArray>().First[Constants.Fields.AccommodationItem.TotalNumberOfReviews].Value<int>().Should().Be(totalNumberOfReviews);
                actual["items"].Value<JArray>().First[Constants.Fields.AccommodationItem.HotelRating].Value<float>().Should().Be(hotelRating);
                actual["items"].Value<JArray>().First["url"].Value<string>().Should().Be(hotelUrl);
                actual["items"].Value<JArray>().First["EcoFacility"].Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldResolveEcoFacility_IfRepositoryReturnResult(string itemPath, HotelFacility hotelFacility)
        {
            // Arrange
            var contextItem = new FakeItem().WithPath(itemPath).WithTemplate(Constants.TemplateIds.Resort);
            resolver.UseContextItem = true;
            var hints = new List<SearchHit<HotelWithReviewSearchResultItem>>()
            {
                {
                    new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()
                    {
                        EcoFacility = JsonConvert.SerializeObject(hotelFacility)
                    })
                }
            };
            var results = new SearchResults<HotelWithReviewSearchResultItem>(hints, 1);

            repository.GetHotelsWithReviews(Arg.Any<string>()).Returns(results);

            using (new ContextItemSwitcher(contextItem))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering(), Substitute.For<IRenderingConfiguration>()));

                // Assert
                actual["items"].Should().HaveCount(1);
                var actualFacility = actual["items"].Value<JArray>().First["EcoFacility"].ToObject<HotelFacility>();
                actualFacility.Name.Should().Be(hotelFacility.Name);
                actualFacility.Tooltip.Should().Be(hotelFacility.Tooltip);
                actualFacility.FacilityCode.Should().Be(hotelFacility.FacilityCode);
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldCapHotelsItems_IfHotelExceededMaxSize(string itemPath)
        {
            // Arrange
            var contextItem = new FakeItem().WithPath(itemPath).WithTemplate(Constants.TemplateIds.Resort);
            resolver.UseContextItem = true;

            var hits = new SearchHit<HotelWithReviewSearchResultItem>[]
            {
                new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()),
                new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()),
                new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()),
                new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()),
                new SearchHit<HotelWithReviewSearchResultItem>(1, new HotelWithReviewSearchResultItem()),
            };

            var results = new SearchResults<HotelWithReviewSearchResultItem>(hits, 1);

            repository.GetHotelsWithReviews(Arg.Any<string>()).Returns(results);

            using (new ContextItemSwitcher(contextItem))
            {
                // Act
                var actual = JObject.FromObject(resolver.ResolveContents(new Rendering(), Substitute.For<IRenderingConfiguration>()));

                // Assert
                actual["items"].Should().HaveCount(2);
            }
        }
    }
}