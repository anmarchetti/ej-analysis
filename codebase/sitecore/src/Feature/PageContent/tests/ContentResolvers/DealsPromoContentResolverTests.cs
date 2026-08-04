using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Foundation.Destinations.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class DealsPromoContentResolverTests
    {
        private readonly DealsPromoContentResolver resolver;
        private readonly IRequestedSearchesService requestedSearchesService;

        public DealsPromoContentResolverTests()
        {
            // Arrange
            requestedSearchesService = Substitute.For<IRequestedSearchesService>();
            resolver = new DealsPromoContentResolver(requestedSearchesService);
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException(DealsPromoContentResolver resolver, IRenderingConfiguration renderingConfiguration)
        {
            // Act
            resolver.ItemSelectorQuery = "./*";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode(IRenderingConfiguration renderingConfig, Db db, RenderingItem renderingItem, string name)
        {
            // Arrange
            var dealsPromoTilesFolderDbitem = new DbItem("Deals Promo");
            var dealspromoTileDbItem = new DbItem("Deals Promo Tile");
            var requestedSearchDbItem = new DbItem("Requested Search", ID.NewID, DestinationsConstants.TemplateIds.RequestedSearch);
            requestedSearchDbItem.Fields.Add(DestinationsConstants.Fields.RequestedSearch.Enabled, DestinationsConstants.Common.CheckboxTrueValue);
            requestedSearchDbItem.Fields.Add(DestinationsConstants.Fields.RequestedSearch.Origin, string.Empty);
            requestedSearchDbItem.Fields.Add(DestinationsConstants.Fields.RequestedSearch.Destination, string.Empty);
            requestedSearchDbItem.Fields.Add(DestinationsConstants.Fields.SearchParameters.StartDate, string.Empty);
            requestedSearchDbItem.Fields.Add(DestinationsConstants.Fields.SearchParameters.EndDate, string.Empty);
            db.Add(requestedSearchDbItem);

            dealspromoTileDbItem.Fields.Add(Constants.Fields.DealsPromo.RequestedSearch, requestedSearchDbItem.ID.ToString());
            dealsPromoTilesFolderDbitem.Add(dealspromoTileDbItem);
            db.Add(dealsPromoTilesFolderDbitem);

            requestedSearchesService.GetRequestedSearchItem(Arg.Any<Item>()).Returns(new Foundation.Destinations.Models.Domain.RequestedSearch(null)
            {
                Name = name
            });

            resolver.ItemSelectorQuery = "./*";

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns("{}");

            // Act
            var actual = JObject.FromObject(resolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = dealsPromoTilesFolderDbitem.ID.ToString() }, renderingConfig));

            // Assert
            actual.Should().HaveCount(1);
            ((string)actual["items"][0]["fields"]["RequestedSearch"]["Name"]).Should().BeEquivalentTo(name);
        }
    }
}
