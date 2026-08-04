using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentResolvers
{
    public class ContextItemDescendantResolverTests
    {
        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnDescendant_IfContextItemHasDescendants(
            ContextItemDescendantResolver resolver,
            IRenderingConfiguration renderingConfiguration,
            ID homeId)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = "//*";

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\" }}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            using (Db db = new Db
            {
                new DbItem("Home", homeId)
                {
                    new DbItem("Item 1"),
                    new DbItem("Item 2")
                }
            })
            {
                Context.Item = db.GetItem(homeId);

                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                (actual as JObject)["items"].Should().NotBeNullOrEmpty();
            }
        }
    }
}