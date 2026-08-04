using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class HotelContentResolverTests
    {
        private readonly HotelContentResolver resolver;
        private IDestinationsRepository repository;

        public HotelContentResolverTests()
        {
            repository = Substitute.For<IDestinationsRepository>();
            // Arrange
            resolver = new HotelContentResolver(repository)
            {
                UseContextItem = true
            };
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            // Act
            var actual = resolver.ResolveContents(null, null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfNotUseContextItemMode()
        {
            // Arrange
            resolver.UseContextItem = false;

            // Act
            var actual = resolver.ResolveContents(new Rendering(), null);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode(
            Item root,
            LocationTemplate locationTemplate,
            CountryTemplate countryTemplate,
            DatasourceTemplate datasourceTemplate,
            HotelFacility facility,
            string code)
        {
            // Arrange
            string testJsonText = @"
                        {
                          ""StarRating"": {
                                ""value"": ""4""
                                },
                            ""Website"": {
                                ""value"": ""www.testHotel.com""
                                }
                        }";

            resolver.UseContextItem = true;

            var hints = new List<SearchHit<HotelSearchResultItem>>()
            {
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem() { ClosestFacility = JsonConvert.SerializeObject(facility) })
                }
            };
            var results = new SearchResults<HotelSearchResultItem>(hints, 1);

            repository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            var country = root.Add("Test Country", new TemplateID(countryTemplate.ID));
            var location = country.Add("Test Location", new TemplateID(locationTemplate.ID));
            var hotel = location.Add("Test Hotel", new TemplateID(datasourceTemplate.ID));

            using (new EditContext(hotel))
            {
                hotel[Constants.Fields.DatasourceItem.Code] = code;
            }

            var renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(testJsonText);

            using (new ContextItemSwitcher(hotel))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig) as JObject;

                // Assert
                ((string)actual["StarRating"]["value"]).Should().BeEquivalentTo("4");
                ((string)actual["Website"]["value"]).Should().BeEquivalentTo("www.testHotel.com");
                actual["Locations"].Should().HaveCount(2);
                actual["ClosestFacility"].ToString().Should().BeEquivalentTo(JObject.FromObject(facility).ToString());
            }
        }
    }
}